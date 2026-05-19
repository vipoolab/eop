// AI Document Classification Service — TOR 5.4.6 PoC #2 (10 คะแนน)
// Classifies uploaded documents into 6 หมวดหน่วยงาน via Claude

import { getClaude, MODELS } from "@/lib/claude";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// 6 หน่วยงาน — fixed taxonomy
// ─────────────────────────────────────────────

export const UNIT_CATEGORIES = [
  {
    code: "ยศ.",
    name: "กองยุทธศาสตร์",
    description:
      "แผนยุทธศาสตร์ระยะยาว / ตัวชี้วัด ก.พ.ร. / แผนปฏิบัติราชการประจำปี",
  },
  {
    code: "ผบ.",
    name: "กองแผนงานอำนวยการ",
    description:
      "การบริหารงานทั่วไป / งานบุคคล / สวัสดิการ / งบประมาณ / พัสดุ",
  },
  {
    code: "มค.",
    name: "กองแผนงานความมั่นคง",
    description:
      "ความมั่นคงของรัฐ / การชุมนุม / การก่อการร้าย / ข่าวกรอง / ปราบปรามอาชญากรรมรุนแรง",
  },
  {
    code: "มข.",
    name: "กองแผนงานกิจการพิเศษ",
    description:
      "ภัยพิบัติ / ถวายความปลอดภัย / งานพิเศษพระราชพิธี / กิจกรรมพิเศษของรัฐ",
  },
  {
    code: "วจ.",
    name: "กองวิจัย",
    description:
      "วิจัยและพัฒนา / สถิติ / นวัตกรรม / การประเมินผลโครงการ",
  },
  {
    code: "อจ.",
    name: "ฝ่ายอำนวยการ สยศ.ตร.",
    description:
      "เลขานุการ / ประสานงาน / สารบรรณ / ITA / การประชุม / การติดต่อระหว่างหน่วย",
  },
] as const;

export type UnitCode = (typeof UNIT_CATEGORIES)[number]["code"];

// ─────────────────────────────────────────────
// File text extraction
// ─────────────────────────────────────────────

const SUPPORTED_MIMES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  txt: "text/plain",
} as const;

export function isSupportedMime(mime: string): boolean {
  return Object.values(SUPPORTED_MIMES).includes(
    mime as (typeof SUPPORTED_MIMES)[keyof typeof SUPPORTED_MIMES]
  );
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mime: string
): Promise<{ text: string; method: string }> {
  // DOCX → mammoth
  if (mime === SUPPORTED_MIMES.docx) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, method: "mammoth/docx" };
  }

  // XLSX/XLS → xlsx
  if (mime === SUPPORTED_MIMES.xlsx || mime === SUPPORTED_MIMES.xls) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];
    for (const sheetName of wb.SheetNames) {
      parts.push(`# Sheet: ${sheetName}`);
      const sheet = wb.Sheets[sheetName];
      parts.push(XLSX.utils.sheet_to_csv(sheet));
    }
    return { text: parts.join("\n\n"), method: "xlsx/sheetToCsv" };
  }

  // Plain text
  if (mime === SUPPORTED_MIMES.txt) {
    return { text: buffer.toString("utf-8"), method: "text/plain" };
  }

  // PDF + images → pass through to Claude (handled separately)
  return { text: "", method: "claude-native" };
}

// ─────────────────────────────────────────────
// Classification via Claude
// ─────────────────────────────────────────────

export interface ClassifyResult {
  unitCode: UnitCode;
  unitName: string;
  confidence: number;
  reasoning: string;
  extractedText: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

const SYSTEM_PROMPT = `คุณเป็นเจ้าหน้าที่กองยุทธศาสตร์ตำรวจ (สยศ.ตร.) ผู้เชี่ยวชาญในการจำแนกเอกสารราชการตามหน่วยงานเจ้าของเรื่อง

# หน้าที่
วิเคราะห์เอกสารที่ผู้ใช้แนบมา แล้วระบุว่าเป็น "ขอบเขตงาน" ของหน่วยงานใดต่อไปนี้:

${UNIT_CATEGORIES.map(
  (u, i) => `${i + 1}. **${u.code}** ${u.name} — ${u.description}`
).join("\n")}

# วิธีพิจารณา
- พิจารณาเรื่อง วัตถุประสงค์ ผู้รับ และเนื้อหาหลัก
- ถ้าครอบคลุมหลายหน่วย ให้เลือกหน่วยที่ "ตรงประเด็นหลัก" ที่สุด
- ถ้าไม่แน่ใจ เลือก "อจ." (ฝ่ายอำนวยการ — ใช้เป็นค่า default งานทั่วไป)

# Output Format (JSON เท่านั้น ไม่ต้องอธิบายภายนอก)
{
  "unitCode": "ยศ." | "ผบ." | "มค." | "มข." | "วจ." | "อจ.",
  "confidence": 0.00-1.00 (ความมั่นใจ),
  "reasoning": "เหตุผลโดยย่อ 1-2 ประโยค",
  "extractedSummary": "สรุปเนื้อหาเอกสารโดยย่อ 2-3 ประโยค"
}`;

interface ClassifyInput {
  /** Extracted text (สำหรับ docx/xlsx/txt) */
  text?: string;
  /** PDF buffer */
  pdfBuffer?: Buffer;
  /** Image buffer */
  imageBuffer?: Buffer;
  imageMime?: "image/jpeg" | "image/png";
  /** Original filename for context */
  filename: string;
}

export async function classifyDocument(
  input: ClassifyInput
): Promise<ClassifyResult> {
  const t0 = Date.now();
  const client = getClaude();

  // Build user message content
  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: { type: "base64"; media_type: string; data: string };
      }
    | {
        type: "document";
        source: { type: "base64"; media_type: string; data: string };
      }
  > = [];

  if (input.pdfBuffer) {
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: input.pdfBuffer.toString("base64"),
      },
    });
  }

  if (input.imageBuffer && input.imageMime) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageMime,
        data: input.imageBuffer.toString("base64"),
      },
    });
  }

  // Text content (or "see attachment" reference)
  const textBlock = [
    `# ชื่อไฟล์: ${input.filename}`,
    "",
    input.text
      ? `# เนื้อหาเอกสาร\n${input.text.slice(0, 12000)}` // cap text to ~12KB
      : "(เนื้อหาเอกสารอยู่ใน attachment ด้านบน)",
    "",
    "กรุณาจำแนกเอกสารและส่งคืน JSON ตาม schema ที่ระบุ",
  ].join("\n");

  content.push({ type: "text", text: textBlock });

  const response = await client.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
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

  const raw = textOut.text
    .trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: {
    unitCode?: string;
    confidence?: number;
    reasoning?: string;
    extractedSummary?: string;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Claude returned invalid JSON: ${raw.slice(0, 200)}`
    );
  }

  const unitCode = (parsed.unitCode || "อจ.") as UnitCode;
  const cat = UNIT_CATEGORIES.find((c) => c.code === unitCode);

  return {
    unitCode,
    unitName: cat?.name ?? "ไม่ทราบ",
    confidence: parsed.confidence ?? 0.5,
    reasoning: parsed.reasoning ?? "",
    extractedText: input.text ?? parsed.extractedSummary ?? "",
    model: MODELS.HAIKU,
    tokensUsed:
      response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
  };
}
