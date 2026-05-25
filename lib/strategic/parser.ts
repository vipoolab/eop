// PDF parser using Claude Opus 4.7
//
// Receives a PDF buffer + level (1/2/3), returns ParsedPlanResult.
// Claude reads the document natively (no OCR layer needed for text PDFs).

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import type {
  ParsedPlanResult,
  ParsedPlanItem,
  PlanLevel,
} from "./types";
import { PLAN_LEVEL_LABELS } from "./types";

function buildPrompt(level: PlanLevel): string {
  const label = PLAN_LEVEL_LABELS[level];
  const levelHint = {
    1: `เอกสารฉบับนี้เป็น "ยุทธศาสตร์ชาติ" (แผนระดับที่ ๑) ซึ่งเป็นแผนสูงสุดของประเทศไทย
- โดยทั่วไปจะมีโครงสร้างเป็น "ด้าน" หลัก ๆ (มักจะ ๖ ด้าน) แต่ละด้านมีประเด็นย่อยอีกหลายชั้น
- ดึงโครงสร้างหลักทั้งหมด พร้อมประเด็นย่อย ๒-๓ ระดับให้ครบ`,
    2: `เอกสารฉบับนี้เป็น "แผนแม่บทภายใต้ยุทธศาสตร์ชาติ" (แผนระดับที่ ๒)
- โดยทั่วไปมี ๑-๒ ประเด็น หลัก แต่ละประเด็นมีเป้าหมาย ตัวชี้วัด และแผนย่อย
- ดึงประเด็น เป้าหมาย และตัวชี้วัด (KPI) ออกมาให้ครบ`,
    3: `เอกสารฉบับนี้เป็น "แผนปฏิบัติราชการ" (แผนระดับที่ ๓) ของหน่วยงาน
- โดยทั่วไปมีโครงสร้างเป็น ประเด็นยุทธศาสตร์ → เป้าประสงค์ → โครงการ/กิจกรรม
- ดึงโครงสร้างทั้งหมด พร้อมหน่วยงานรับผิดชอบและตัวชี้วัด`,
  }[level];

  return `คุณเป็น AI ผู้เชี่ยวชาญด้านเอกสารราชการไทย โดยเฉพาะเอกสารแผนยุทธศาสตร์ของหน่วยงานภาครัฐ

ภารกิจ: อ่านเอกสาร PDF ฉบับนี้ และดึงโครงสร้างลำดับชั้นของเนื้อหาออกมาเป็น JSON

${levelHint}

ระดับเอกสาร: ${label} (ระดับ ${level})

ตอบกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่น) ตาม schema นี้:

{
  "title": "ชื่อเต็มของแผน",
  "description": "คำอธิบายภาพรวมของแผน (วิสัยทัศน์ / เป้าประสงค์)",
  "metadata": {
    "startYear": 2566,
    "endYear": 2580,
    "vision": "วิสัยทัศน์ (ถ้ามี)",
    "issuedBy": "หน่วยงานผู้จัดทำ",
    "agency": "หน่วยงานเจ้าของแผน"
  },
  "items": [
    {
      "number": "๑",
      "name": "ชื่อหัวข้อ",
      "description": "เนื้อหาโดยย่อ",
      "meta": {
        "kpi": "ตัวชี้วัด (ถ้ามี)",
        "targetYear": "ปีเป้าหมาย",
        "owner": "หน่วยงานรับผิดชอบ"
      },
      "sub_items": [
        {
          "number": "๑.๑",
          "name": "หัวข้อย่อย",
          "description": "...",
          "sub_items": []
        }
      ]
    }
  ]
}

คำแนะนำสำคัญ:
- ใช้เลขไทย (๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙ ๐) ถ้าเอกสารใช้เลขไทย — มิเช่นนั้นใช้เลขอารบิก
- เก็บลำดับเดิมของเอกสารไว้ ห้ามปรับเรียงใหม่
- ถ้าไม่มีข้อมูลในช่องใด ให้ส่ง null หรือไม่ใส่ key นั้น
- ดึงให้ครบทุกหัวข้อหลัก และให้ดึงประเด็นย่อยอย่างน้อย ๒ ระดับชั้น`;
}

export interface ParseOptions {
  level: PlanLevel;
  pdfBuffer: Buffer;
  fileName?: string;
}

export interface ParseSuccess {
  ok: true;
  result: ParsedPlanResult;
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ParseFailure {
  ok: false;
  error: string;
  durationMs: number;
}

export type ParseOutcome = ParseSuccess | ParseFailure;

const FALLBACK_RESULT: ParsedPlanResult = {
  title: "(ไม่สามารถ parse เอกสารได้)",
  items: [],
};

export async function parsePlanDocument(opts: ParseOptions): Promise<ParseOutcome> {
  const start = Date.now();
  let client;
  try {
    client = getClaude();
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message,
      durationMs: Date.now() - start,
    };
  }

  try {
    const pdfBase64 = opts.pdfBuffer.toString("base64");

    const response = await client.messages.create({
      model: MODELS.OPUS,
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: buildPrompt(opts.level) },
          ],
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        ok: false,
        error: "AI Engine ไม่ได้คืน text content",
        durationMs: Date.now() - start,
      };
    }

    const parsed = parseClaudeJson<ParsedPlanResult>(textBlock.text, FALLBACK_RESULT);
    if (!parsed.items?.length) {
      return {
        ok: false,
        error: "AI ดึงโครงสร้างไม่ได้ — ลองตรวจสอบว่า PDF มีตัวอักษร (ไม่ใช่สแกน)",
        durationMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      result: parsed,
      model: MODELS.OPUS,
      durationMs: Date.now() - start,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message || "เกิดข้อผิดพลาดในการประมวลผล",
      durationMs: Date.now() - start,
    };
  }
}

// Convert parsed Claude result into PlanItem records for the store
export interface ItemRecord {
  id: string;
  documentId: string;
  parentItemId: string | null;
  number: string;
  name: string;
  description?: string;
  meta?: ParsedPlanItem["meta"];
  order: number;
}

export function flattenParsedItems(
  documentId: string,
  parsedItems: ParsedPlanItem[]
): ItemRecord[] {
  const result: ItemRecord[] = [];
  let idCounter = 0;

  function visit(items: ParsedPlanItem[], parentId: string | null) {
    items.forEach((it, idx) => {
      const id = `${documentId}-item-${++idCounter}`;
      result.push({
        id,
        documentId,
        parentItemId: parentId,
        number: it.number,
        name: it.name,
        description: it.description,
        meta: it.meta,
        order: idx + 1,
      });
      if (it.sub_items?.length) visit(it.sub_items, id);
    });
  }

  visit(parsedItems, null);
  return result;
}
