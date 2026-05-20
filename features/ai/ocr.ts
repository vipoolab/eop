// AI OCR Service — TOR 5.4.6 / 6.10.3(ค) PoC #3
// Extract Thai text from images and PDFs using Claude Vision + Document

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";

export interface OcrResult {
  text: string;
  detectedLines: number;
  confidence: number;
  reasoning: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
  pages?: number;
}

const SYSTEM_PROMPT = `คุณเป็น OCR engine ขั้นสูงที่เชี่ยวชาญด้านการอ่านเอกสารราชการภาษาไทย

# หน้าที่
อ่านและสกัดข้อความ "ทั้งหมด" จากเอกสารที่ได้รับ ให้ครบถ้วนและถูกต้องตามต้นฉบับ

# กฎ
- รักษารูปแบบ/การเว้นบรรทัดของต้นฉบับให้มากที่สุด
- ห้ามตีความ ห้ามแก้ไข ห้ามเพิ่มเติม — ลอกตามที่เห็นเท่านั้น
- ถ้าคำใดอ่านไม่ออก ให้ใส่ [...อ่านไม่ออก...] แทน
- ตัวเลขไทย (๐-๙) ให้คงตามต้นฉบับ
- เครื่องหมายและสัญลักษณ์ คงตามต้นฉบับ
- หัวกระดาษ ตรา และข้อความทั้งหมด ต้องอ่านครบ
- ถ้า PDF มีหลายหน้า ให้แยกแต่ละหน้าด้วย "--- หน้า N ---"

# Output Format (JSON เท่านั้น)
{
  "text": "ข้อความทั้งหมดที่อ่านได้ — รักษา line breaks",
  "detectedLines": <จำนวนบรรทัด>,
  "pages": <จำนวนหน้า (สำหรับ PDF) หรือ 1>,
  "confidence": 0.00-1.00 (ความมั่นใจว่าอ่านถูก),
  "reasoning": "ข้อสังเกต 1-2 ประโยค เช่น คุณภาพภาพ ส่วนที่อ่านยาก"
}`;

type SupportedMime =
  | "image/jpeg"
  | "image/png"
  | "application/pdf";

export function isOcrSupported(mime: string): boolean {
  return ["image/jpeg", "image/png", "application/pdf"].includes(mime);
}

export async function performOcr(input: {
  fileBuffer: Buffer;
  mimeType: SupportedMime;
}): Promise<OcrResult> {
  const t0 = Date.now();
  const client = getClaude();

  // PDF → document type, Image → image type
  const isPdf = input.mimeType === "application/pdf";

  const content = isPdf
    ? [
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf",
            data: input.fileBuffer.toString("base64"),
          },
        },
        {
          type: "text" as const,
          text: "กรุณาอ่านข้อความทั้งหมดในเอกสาร PDF นี้ (รวมทุกหน้า) และส่งคืน JSON ตาม schema",
        },
      ]
    : [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: input.mimeType,
            data: input.fileBuffer.toString("base64"),
          },
        },
        {
          type: "text" as const,
          text: "กรุณาอ่านข้อความทั้งหมดในภาพ และส่งคืน JSON ตาม schema",
        },
      ];

  const response = await client.messages.create({
    model: MODELS.SONNET,
    max_tokens: 8192, // bigger for multi-page PDFs
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: content as any,
      },
    ],
  });

  const textOut = response.content.find((b) => b.type === "text");
  if (!textOut || textOut.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const parsed = parseClaudeJson<{
    text?: string;
    detectedLines?: number;
    pages?: number;
    confidence?: number;
    reasoning?: string;
  }>(textOut.text, {
    text: textOut.text,
    detectedLines: 0,
    pages: 1,
    confidence: 0.5,
  });

  return {
    text: parsed.text ?? "",
    detectedLines:
      parsed.detectedLines ?? parsed.text?.split("\n").length ?? 0,
    pages: parsed.pages ?? 1,
    confidence: parsed.confidence ?? 0.8,
    reasoning: parsed.reasoning ?? "",
    model: MODELS.SONNET,
    tokensUsed:
      response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}
