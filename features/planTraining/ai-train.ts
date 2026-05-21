// NLP Training — TOR 5.4.1 ๑.๑.๑
// AI เรียนรู้บริบทและความสัมพันธ์ของแผนแต่ละระดับ

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";

export interface TrainedInsights {
  summary: string;
  keyConcepts: string[];
  themes: string[];
  targetOutcomes: string[];
  relatedDomains: string[];
}

export interface TrainingResult extends TrainedInsights {
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้าน NLP สำหรับการวิเคราะห์แผนยุทธศาสตร์ภาครัฐไทย

# หน้าที่
อ่านเนื้อหาแผนยุทธศาสตร์ แล้ว "เรียนรู้บริบทและความสัมพันธ์" โดยสกัดข้อมูลสำคัญ
ผลลัพธ์จะถูกเก็บเป็น context สำหรับให้ AI ใช้วิเคราะห์การสอดคล้องในอนาคต

# สิ่งที่ต้องสกัด
- summary: สรุปเนื้อหาของแผนใน 2-3 ประโยค
- keyConcepts: ประเด็นหลัก 3-7 ข้อ (คำสำคัญ/concept)
- themes: ธีมเชิงนโยบาย 2-5 ข้อ (เช่น "ความมั่นคง", "การปราบยาเสพติด")
- targetOutcomes: ผลลัพธ์ที่คาดหวัง 3-5 ข้อ
- relatedDomains: หน่วยงาน/พื้นที่/ภารกิจที่เกี่ยวข้อง 2-5 ข้อ

# Output Format (JSON เท่านั้น)
{
  "summary": "...",
  "keyConcepts": ["...", "..."],
  "themes": ["...", "..."],
  "targetOutcomes": ["...", "..."],
  "relatedDomains": ["...", "..."]
}`;

export async function learnPlanContext(plan: {
  level: string;
  code: string;
  title: string;
  description: string | null;
  policyIntent: string | null;
  parentTitle: string | null;
  kpiSummaries: string[];
}): Promise<TrainingResult> {
  const t0 = Date.now();

  const userPrompt = [
    `# แผนยุทธศาสตร์ที่ต้องวิเคราะห์`,
    `ระดับ: ${plan.level}`,
    `รหัส: ${plan.code}`,
    `ชื่อ: ${plan.title}`,
    plan.parentTitle ? `แผนแม่: ${plan.parentTitle}` : "",
    `รายละเอียด: ${plan.description ?? "(ไม่มี)"}`,
    `เจตนาเชิงนโยบาย: ${plan.policyIntent ?? "(ไม่มี)"}`,
    plan.kpiSummaries.length > 0
      ? `\n# ตัวชี้วัด:\n${plan.kpiSummaries.map((k) => `- ${k}`).join("\n")}`
      : "",
    ``,
    `กรุณาสกัด context ของแผนนี้และตอบกลับเป็น JSON`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await getClaude().messages.create({
    model: MODELS.OPUS,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const parsed = parseClaudeJson<Partial<TrainedInsights>>(textBlock.text, {
    summary: "",
    keyConcepts: [],
    themes: [],
    targetOutcomes: [],
    relatedDomains: [],
  });

  return {
    summary: parsed.summary ?? "",
    keyConcepts: parsed.keyConcepts ?? [],
    themes: parsed.themes ?? [],
    targetOutcomes: parsed.targetOutcomes ?? [],
    relatedDomains: parsed.relatedDomains ?? [],
    model: MODELS.OPUS,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}

/** Serialize insights to plain text for storage in AiTrainingDocument.content */
export function serializeInsights(insights: TrainedInsights): string {
  return [
    `# Summary`,
    insights.summary,
    ``,
    `# Key Concepts`,
    ...insights.keyConcepts.map((k) => `- ${k}`),
    ``,
    `# Themes`,
    ...insights.themes.map((t) => `- ${t}`),
    ``,
    `# Target Outcomes`,
    ...insights.targetOutcomes.map((o) => `- ${o}`),
    ``,
    `# Related Domains`,
    ...insights.relatedDomains.map((d) => `- ${d}`),
  ].join("\n");
}

/** Parse stored content back into insights structure */
export function parseInsights(content: string): TrainedInsights {
  const sections = content.split(/^# /m).filter(Boolean);
  const result: TrainedInsights = {
    summary: "",
    keyConcepts: [],
    themes: [],
    targetOutcomes: [],
    relatedDomains: [],
  };
  for (const sec of sections) {
    const lines = sec.split("\n");
    const heading = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    const items = body
      .split("\n")
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);
    if (heading === "Summary") result.summary = body;
    else if (heading === "Key Concepts") result.keyConcepts = items;
    else if (heading === "Themes") result.themes = items;
    else if (heading === "Target Outcomes") result.targetOutcomes = items;
    else if (heading === "Related Domains") result.relatedDomains = items;
  }
  return result;
}
