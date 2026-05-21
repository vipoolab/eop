// AI Strategic Alignment
// TOR 5.4.1 ๑.๒.๑ Linkage Analysis: ร่างข้อสั่งการ ↔ ยุทธศาสตร์ชาติ
// TOR 5.4.1 ๑.๒.๒ Draft Recommendation: AI แนะนำการปรับข้อความให้สอดคล้องกับ KPI + เป้าหมาย

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";

export interface CommandAlignmentInput {
  command: {
    docNo: string;
    subject: string;
    objective: string | null;
    body: string;
  };
  plan: {
    code: string;
    title: string;
    description: string | null;
    policyIntent: string | null;
  };
  kpis: Array<{
    code: string;
    name: string;
    target: number;
    unit: string | null;
  }>;
}

export interface CommandAlignmentResult {
  score: number; // 0.0 - 1.0
  gaps: string[];
  suggestions: string[];
  /** ๑.๒.๒ Draft Recommendation — ข้อความแก้ไขเสนอแนะ (suggested rewrite) */
  suggestedBody: string | null;
  rationale: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

const COMMAND_SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์ความสอดคล้องระหว่างคำสั่งราชการกับแผนยุทธศาสตร์

# หน้าที่
๑) วิเคราะห์ความเชื่อมโยง (Linkage Analysis) ระหว่างร่างข้อสั่งการกับยุทธศาสตร์ชาติ
๒) แนะนำการปรับแก้ไขข้อความให้สอดคล้องกับตัวชี้วัด (KPI) และเป้าหมายของแผน

# วิธีพิจารณา
- คำสั่งราชการมีจุดประสงค์ที่ตรงกับเป้าหมายของแผนหรือไม่
- มีการอ้างอิงถึง KPI ตัวชี้วัดในเนื้อหาคำสั่งหรือไม่
- ภาษาคำสั่งสอดคล้องกับโทนยุทธศาสตร์หรือไม่
- มีช่องว่าง (gap) ที่คำสั่งไม่ครอบคลุมเป้าหมายแผนหรือไม่

# Output Format (JSON เท่านั้น)
{
  "score": 0.00-1.00 (ระดับความสอดคล้องของคำสั่ง vs แผน + KPI),
  "gaps": ["gap ที่คำสั่งไม่ครอบคลุม"],
  "suggestions": ["ข้อเสนอแนะการแก้ไขเนื้อหา"],
  "suggestedBody": "ร่างเนื้อหาคำสั่งฉบับปรับปรุงให้สอดคล้องกับเป้าหมายแผน + KPI (เก็บโครงสร้างย่อหน้าและภาษาราชการ)",
  "rationale": "เหตุผลโดยย่อ 1-2 ประโยค"
}`;

export async function analyzeCommandAlignment(
  input: CommandAlignmentInput
): Promise<CommandAlignmentResult> {
  const t0 = Date.now();

  const kpiLines =
    input.kpis.length > 0
      ? input.kpis
          .map(
            (k) =>
              `- ${k.code} · ${k.name} · เป้า ${k.target}${k.unit ? " " + k.unit : ""}`
          )
          .join("\n")
      : "(ไม่มี KPI ผูกกับแผนนี้)";

  const userPrompt = [
    `# ร่างข้อสั่งการ`,
    `เลขที่: ${input.command.docNo}`,
    `หัวเรื่อง: ${input.command.subject}`,
    `วัตถุประสงค์: ${input.command.objective ?? "(ไม่มี)"}`,
    `เนื้อหา:`,
    input.command.body,
    ``,
    `# แผนยุทธศาสตร์ที่ผูก`,
    `รหัส: ${input.plan.code}`,
    `ชื่อ: ${input.plan.title}`,
    `รายละเอียด: ${input.plan.description ?? "(ไม่มี)"}`,
    `เจตนาเชิงนโยบาย: ${input.plan.policyIntent ?? "(ไม่มี)"}`,
    ``,
    `# ตัวชี้วัด (KPI) ของแผน`,
    kpiLines,
    ``,
    `กรุณาวิเคราะห์ Linkage Analysis + Draft Recommendation และส่งคืน JSON ตาม schema`,
  ].join("\n");

  const response = await getClaude().messages.create({
    model: MODELS.OPUS, // ใช้ Opus 4.5 สำหรับ rewrite ที่ต้องการ quality
    max_tokens: 4096,
    system: COMMAND_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textOut = response.content.find((b) => b.type === "text");
  if (!textOut || textOut.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const parsed = parseClaudeJson<{
    score?: number;
    gaps?: string[];
    suggestions?: string[];
    suggestedBody?: string | null;
    rationale?: string;
  }>(textOut.text, {
    score: 0.5,
    gaps: [],
    suggestions: [],
    suggestedBody: null,
    rationale: textOut.text,
  });

  return {
    score: parsed.score ?? 0.5,
    gaps: parsed.gaps ?? [],
    suggestions: parsed.suggestions ?? [],
    suggestedBody: parsed.suggestedBody ?? null,
    rationale: parsed.rationale ?? "",
    model: MODELS.OPUS,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}
