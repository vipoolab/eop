// AI OCR Service — TOR 5.4.6 / 6.10.3(ค) PoC #3
// Extract Thai text from images using Claude Vision

import { getClaude, MODELS } from "@/lib/claude";

export interface OcrResult {
  text: string;
  detectedLines: number;
  confidence: number;
  reasoning: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

const SYSTEM_PROMPT = `คุณเป็น OCR engine ขั้นสูงที่เชี่ยวชาญด้านการอ่านเอกสารราชการภาษาไทย

# หน้าที่
อ่านและสกัดข้อความ "ทั้งหมด" จากภาพที่ได้รับ ให้ครบถ้วนและถูกต้องตามต้นฉบับ

# กฎ
- รักษารูปแบบ/การเว้นบรรทัดของต้นฉบับให้มากที่สุด
- ห้ามตีความ ห้ามแก้ไข ห้ามเพิ่มเติม — ลอกตามที่เห็นเท่านั้น
- ถ้าคำใดอ่านไม่ออก ให้ใส่ [...อ่านไม่ออก...] แทน
- ตัวเลขไทย (๐-๙) ให้คงตามต้นฉบับ
- เครื่องหมายและสัญลักษณ์ คงตามต้นฉบับ
- หัวกระดาษ ตรา และข้อความทั้งหมดในภาพ ต้องอ่านครบ

# Output Format (JSON เท่านั้น)
{
  "text": "ข้อความทั้งหมดที่อ่านได้ — รักษา line breaks",
  "detectedLines": <จำนวนบรรทัด>,
  "confidence": 0.00-1.00 (ความมั่นใจว่าอ่านถูก),
  "reasoning": "ข้อสังเกต 1-2 ประโยค เช่น คุณภาพภาพ ส่วนที่อ่านยาก"
}`;

export async function performOcr(input: {
  imageBuffer: Buffer;
  mimeType: "image/jpeg" | "image/png";
}): Promise<OcrResult> {
  const t0 = Date.now();
  const client = getClaude();

  const response = await client.messages.create({
    model: MODELS.SONNET, // Use Sonnet for OCR — better vision accuracy
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mimeType,
              data: input.imageBuffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: "กรุณาอ่านข้อความทั้งหมดในภาพ และส่งคืน JSON ตาม schema",
          },
        ],
      },
    ],
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
    text?: string;
    detectedLines?: number;
    confidence?: number;
    reasoning?: string;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback — treat entire output as text
    parsed = { text: raw, detectedLines: 0, confidence: 0.5 };
  }

  return {
    text: parsed.text ?? "",
    detectedLines:
      parsed.detectedLines ?? parsed.text?.split("\n").length ?? 0,
    confidence: parsed.confidence ?? 0.8,
    reasoning: parsed.reasoning ?? "",
    model: MODELS.SONNET,
    tokensUsed:
      response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}
