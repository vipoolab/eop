// Executive Summary AI generator — TOR 6.2 / 8.10.10
// ดึงข้อมูลจากทั้งระบบ (P1 Plan/KPI, P2 Mission, P4 Command/Incident) → สรุปด้วย Claude

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import { prisma } from "@/lib/prisma";

export type Scope = "NATIONAL" | "REGION" | "UNIT";

export interface ExecSummaryOutput {
  title: string;
  summaryText: string;
  keyMetrics: Record<string, number | string>;
  concerns: string[];
  recommendations: string[];
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

export async function generateExecSummary(input: {
  scope: Scope;
  period: string;
  unitId?: string | null;
}): Promise<ExecSummaryOutput> {
  // ─── Collect data from all systems ───
  const [
    activeMissions,
    closedMissions,
    openIncidents,
    closedIncidents,
    pendingCommands,
    closedCommands,
    kpis,
    complianceApproved,
    complianceInProgress,
  ] = await Promise.all([
    prisma.mission.count({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
    }),
    prisma.mission.count({ where: { status: "CLOSED" } }),
    prisma.incident.count({ where: { status: "open" } }),
    prisma.incident.count({ where: { status: { not: "open" } } }),
    prisma.command.count({
      where: { status: { in: ["SUBMITTED", "APPROVED", "PUBLISHED"] } },
    }),
    prisma.command.count({ where: { status: "CLOSED" } }),
    prisma.kpi.findMany({
      select: { code: true, name: true, target: true, actual: true, status: true },
      take: 30,
    }),
    prisma.complianceReport.count({ where: { status: "APPROVED" } }),
    prisma.complianceReport.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "REVIEWED"] } },
    }),
  ]);

  const greenKpis = kpis.filter((k) => k.status === "green").length;
  const yellowKpis = kpis.filter((k) => k.status === "yellow").length;
  const redKpis = kpis.filter((k) => k.status === "red").length;

  const keyMetrics: Record<string, number | string> = {
    period: input.period,
    scope: input.scope,
    activeMissions,
    closedMissions,
    openIncidents,
    closedIncidents,
    pendingCommands,
    closedCommands,
    totalKpis: kpis.length,
    kpiGreen: greenKpis,
    kpiYellow: yellowKpis,
    kpiRed: redKpis,
    complianceApproved,
    complianceInProgress,
  };

  // Top 3 underperforming KPIs
  const underperforming = kpis
    .filter((k) => k.target > 0 && k.actual / k.target < 0.7)
    .sort((a, b) => a.actual / a.target - b.actual / b.target)
    .slice(0, 3);

  // ─── Build prompt for Claude ───
  const scopeText =
    input.scope === "NATIONAL"
      ? "ระดับชาติ (ทั่วประเทศ)"
      : input.scope === "REGION"
        ? "ระดับภาค"
        : "ระดับหน่วย";

  const systemPrompt = `คุณคือผู้ช่วยเลขาธิการ ผบ.ตร. ทำหน้าที่สรุปสถานการณ์ของสำนักงานตำรวจแห่งชาติให้ผู้บริหารระดับสูง

หน้าที่:
- เขียนสรุป 1 หน้า ภาษาราชการไทยที่อ่านง่าย กระชับ
- ระบุประเด็นที่ต้องให้ความสำคัญ (concerns)
- แนะนำการตัดสินใจเชิงรุก (recommendations)

ต้องตอบเป็น JSON object เท่านั้น:
{
  "title": "string (ชื่อรายงาน)",
  "summaryText": "string (สรุป 200-400 คำ)",
  "concerns": ["string", "string", "string"],
  "recommendations": ["string", "string", "string"]
}`;

  const userPrompt = `สร้างสรุปสำหรับผู้บริหาร ${scopeText} ช่วง ${input.period}

ข้อมูลปัจจุบัน:
- ภารกิจกำลังดำเนินการ: ${activeMissions} ภารกิจ
- ภารกิจปิดแล้ว: ${closedMissions} ภารกิจ
- เหตุการณ์เปิดอยู่: ${openIncidents} เหตุการณ์
- เหตุการณ์ปิดแล้ว: ${closedIncidents} เหตุการณ์
- คำสั่งรอดำเนินการ: ${pendingCommands} ฉบับ
- คำสั่งสำเร็จ: ${closedCommands} ฉบับ
- KPI รวม: ${kpis.length} ตัว (เขียว ${greenKpis} / เหลือง ${yellowKpis} / แดง ${redKpis})
- รายงาน Compliance อนุมัติแล้ว: ${complianceApproved}
- รายงาน Compliance กำลังจัดทำ: ${complianceInProgress}

KPI ที่บรรลุเป้าหมายต่ำสุด 3 อันดับ:
${underperforming.map((k) => `- ${k.code} ${k.name}: ${k.actual}/${k.target} (${((k.actual / k.target) * 100).toFixed(0)}%)`).join("\n") || "(ไม่มี)"}

ให้สรุปเชิงยุทธศาสตร์ ระบุประเด็นกังวลที่ผู้บริหารควรรู้ และข้อเสนอแนะการตัดสินใจ`;

  const start = Date.now();
  const claude = getClaude();
  const resp = await claude.messages.create({
    model: MODELS.OPUS,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const elapsedMs = Date.now() - start;
  const tokensUsed = (resp.usage?.input_tokens ?? 0) + (resp.usage?.output_tokens ?? 0);
  const textContent = resp.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("\n");

  const parsed = parseClaudeJson<{
    title: string;
    summaryText: string;
    concerns: string[];
    recommendations: string[];
  }>(textContent, {
    title: "",
    summaryText: "",
    concerns: [],
    recommendations: [],
  });

  return {
    title: parsed.title || `สรุปสำหรับผู้บริหาร ${scopeText} ${input.period}`,
    summaryText: parsed.summaryText || "(AI ไม่ได้สร้างสรุป)",
    keyMetrics,
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [],
    model: MODELS.OPUS,
    tokensUsed,
    elapsedMs,
  };
}
