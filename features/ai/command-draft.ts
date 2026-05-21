// AI Command Drafting Service — TOR 5.4.4 PoC #1
// Generates Thai police-style command text from structured input

import { getClaude, MODELS, DEFAULT_MAX_TOKENS, parseClaudeJson } from "@/lib/claude";

export interface DraftInput {
  /** หัวเรื่อง */
  subject: string;
  /** วัตถุประสงค์ของการสั่งการ */
  objective: string;
  /** หน่วยรับ */
  recipient: string;
  /** ระยะเวลา/Deadline */
  timeframe?: string;
  /** บริบทเพิ่มเติม / สถานการณ์ */
  context?: string;
  /** ลำดับความสำคัญ (ส่งผลต่อโทนข้อความ) */
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  /** TOR ๒.๒.๒ — History Data: คลังคำสั่งเก่าที่คล้ายกัน (excerpt) */
  historyExcerpts?: Array<{
    docNo: string;
    subject: string;
    bodySnippet: string;
  }>;
  /** TOR ๒.๑.๑ — Mission context (optional): goals/scope/KPIs ของภารกิจที่ผูก */
  missionContext?: {
    code: string;
    title: string;
    goals: string[];
    scope: string | null;
    kpiNames: string[];
  };
}

export interface DraftOutput {
  reference: string;
  objective: string;
  body: string;
  model: string;
  tokensUsed: number;
  /** จำนวนคำสั่งเก่าที่ AI ใช้เป็น context */
  historyUsed: number;
  /** มี Mission context ที่ใช้หรือไม่ (TOR ๒.๑.๑) */
  missionContextUsed: boolean;
}

const SYSTEM_PROMPT = `คุณเป็นเจ้าหน้าที่กองยุทธศาสตร์ตำรวจ (สยศ.ตร.) ที่เชี่ยวชาญในการร่างหนังสือสั่งการราชการตามมาตรฐานสำนักงานปลัดสำนักนายกรัฐมนตรี

# หน้าที่
ช่วยร่าง "เนื้อหาคำสั่ง" จากข้อมูลที่ผู้ใช้ระบุ

# มาตรฐานภาษา
- ใช้ภาษาราชการที่กระชับ ชัดเจน เป็นทางการ
- หลีกเลี่ยงคำซ้ำซ้อน คำคลุมเครือ
- ใช้คำศัพท์ทหาร/ตำรวจที่ถูกต้อง เช่น "ผู้บังคับบัญชา" "หน่วยปฏิบัติ" "สั่งการให้ดำเนินการ"
- ลำดับเนื้อหา: อ้างถึง → เหตุผล/สถานการณ์ → การสั่งการ → ระยะเวลา → ผู้รับผิดชอบ

# Output Format (JSON เท่านั้น ไม่ต้องอธิบายภายนอก)
{
  "reference": "ข้อความ 'อ้างถึง' (เช่น คำสั่งเดิม / หนังสือ / ระเบียบ)",
  "objective": "ระบุวัตถุประสงค์ในประโยคเดียวเป็นทางการ",
  "body": "เนื้อหาคำสั่งเต็ม (4-8 ย่อหน้า) แบ่งเป็นข้อย่อย ๑. / ๒. / ๓. ถ้าเหมาะสม"
}`;

function buildUserPrompt(input: DraftInput): string {
  const priorityNote =
    input.priority === "URGENT" || input.priority === "CRITICAL"
      ? "โทนเร่งด่วน — เน้นคำว่า 'โดยด่วน' 'เร่งดำเนินการ'"
      : "โทนปกติ";

  // History Data section (TOR ๒.๒.๒)
  const historySection =
    input.historyExcerpts && input.historyExcerpts.length > 0
      ? [
          ``,
          `# คลังคำสั่งเก่าที่คล้ายกัน (สำหรับศึกษารูปแบบและ Keywords)`,
          ...input.historyExcerpts.map(
            (h, i) =>
              `[${i + 1}] ${h.docNo} · ${h.subject}\n${h.bodySnippet.slice(0, 400)}`
          ),
          ``,
          `→ ใช้รูปแบบและภาษาราชการในตัวอย่างเป็นแนวทาง แต่ปรับเนื้อหาให้ตรงข้อมูลที่ระบุข้างต้น`,
        ].join("\n")
      : "";

  // Mission context (TOR ๒.๑.๑ — AI-Assisted Command Drafting จากภารกิจ)
  const missionSection = input.missionContext
    ? [
        ``,
        `# ภารกิจที่ผูก (สำหรับ AI ใช้เป็นบริบทร่างคำสั่ง)`,
        `รหัส: ${input.missionContext.code}`,
        `ชื่อ: ${input.missionContext.title}`,
        input.missionContext.goals.length > 0
          ? `เป้าหมาย:\n${input.missionContext.goals.map((g) => `- ${g}`).join("\n")}`
          : "",
        input.missionContext.scope ? `ขอบเขต: ${input.missionContext.scope}` : "",
        input.missionContext.kpiNames.length > 0
          ? `ตัวชี้วัด:\n${input.missionContext.kpiNames.map((k) => `- ${k}`).join("\n")}`
          : "",
        ``,
        `→ ให้คำสั่งสอดคล้องกับเป้าหมายและตัวชี้วัดของภารกิจนี้`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    `# ข้อมูลร่างคำสั่ง`,
    `**หัวเรื่อง:** ${input.subject}`,
    `**วัตถุประสงค์:** ${input.objective}`,
    `**หน่วยรับ:** ${input.recipient}`,
    input.timeframe ? `**ระยะเวลา/Deadline:** ${input.timeframe}` : "",
    input.context ? `**บริบทเพิ่มเติม:** ${input.context}` : "",
    `**ความสำคัญ:** ${input.priority ?? "NORMAL"} (${priorityNote})`,
    missionSection,
    historySection,
    ``,
    `กรุณาร่างคำสั่งตามมาตรฐาน — return JSON เท่านั้น`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateCommandDraft(
  input: DraftInput
): Promise<DraftOutput> {
  const response = await getClaude().messages.create({
    model: MODELS.OPUS,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
  });

  // Extract text from first content block
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const parsed = parseClaudeJson<{
    reference?: string;
    objective?: string;
    body?: string;
  }>(textBlock.text, { body: textBlock.text });

  return {
    reference: parsed.reference ?? "",
    objective: parsed.objective ?? input.objective,
    body: parsed.body ?? "",
    model: MODELS.OPUS,
    tokensUsed:
      response.usage.input_tokens + response.usage.output_tokens,
    historyUsed: input.historyExcerpts?.length ?? 0,
    missionContextUsed: !!input.missionContext,
  };
}
