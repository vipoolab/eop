// AI Strategic Plan Alignment — TOR 1.1.1, 1.2.1
// NLP analyzes whether lower-level plans align with upper-level plans
// Suggests revisions where misalignment exists

import { getClaude, MODELS } from "@/lib/claude";

export interface AlignmentInput {
  parent: { code: string; title: string; description: string | null };
  child: { code: string; title: string; description: string | null };
}

export interface AlignmentResult {
  score: number; // 0.0 - 1.0 alignment strength
  gaps: string[]; // identified gaps
  suggestions: string[]; // recommended revisions
  rationale: string; // overall reasoning
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์แผนยุทธศาสตร์ภาครัฐ
มีหน้าที่ตรวจสอบความสอดคล้อง (alignment) ระหว่างแผนระดับบนและแผนระดับล่าง

# วิธีพิจารณา
- แผนระดับล่างต้อง "ตอบโจทย์" หรือ "ขยายความ" แผนระดับบน
- หาว่ามี gap (ช่องว่าง) หรือไม่ — เป้าหมายของแผนบนที่แผนล่างไม่ได้ครอบคลุม
- หาว่ามีส่วนเกิน (out-of-scope) หรือไม่ — แผนล่างพูดถึงเรื่องที่ไม่อยู่ในแผนบน
- ความสอดคล้องของภาษา/concept

# Output Format (JSON เท่านั้น)
{
  "score": 0.00-1.00 (ความสอดคล้อง),
  "gaps": ["gap 1", "gap 2", ...] (สิ่งที่แผนล่างไม่ครอบคลุม),
  "suggestions": ["suggestion 1", ...] (ข้อเสนอแนะการปรับปรุง),
  "rationale": "เหตุผลโดยย่อ 1-2 ประโยค"
}`;

export async function analyzeAlignment(
  input: AlignmentInput
): Promise<AlignmentResult> {
  const t0 = Date.now();

  const userPrompt = [
    `# แผนระดับบน`,
    `รหัส: ${input.parent.code}`,
    `ชื่อ: ${input.parent.title}`,
    `รายละเอียด: ${input.parent.description ?? "(ไม่มี)"}`,
    ``,
    `# แผนระดับล่าง`,
    `รหัส: ${input.child.code}`,
    `ชื่อ: ${input.child.title}`,
    `รายละเอียด: ${input.child.description ?? "(ไม่มี)"}`,
    ``,
    `กรุณาวิเคราะห์ความสอดคล้องและส่งคืน JSON ตาม schema`,
  ].join("\n");

  const response = await getClaude().messages.create({
    model: MODELS.HAIKU,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textOut = response.content.find((b) => b.type === "text");
  if (!textOut || textOut.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const raw = textOut.text
    .trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: {
    score?: number;
    gaps?: string[];
    suggestions?: string[];
    rationale?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { score: 0.5, gaps: [], suggestions: [], rationale: raw };
  }

  return {
    score: parsed.score ?? 0.5,
    gaps: parsed.gaps ?? [],
    suggestions: parsed.suggestions ?? [],
    rationale: parsed.rationale ?? "",
    model: MODELS.HAIKU,
    tokensUsed:
      response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}
