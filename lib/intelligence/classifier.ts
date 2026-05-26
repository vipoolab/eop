// AI Doc Classifier — classifies Thai government police documents into 11
// work-type categories per TOR EOP ข้อ (๔), using the best available model.
// Falls back to keyword scoring if AI is unavailable.
//
// Supports:
//  - Plain text input (fastest)
//  - PDF via vision input (most accurate for scanned PDFs)

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import { DOC_CATEGORIES, CATEGORY_KEYWORDS } from "./types";
import type { DocCategory } from "./types";
import type Anthropic from "@anthropic-ai/sdk";

export interface ClassifyResult {
  predicted: DocCategory;
  predictedConfidence: number;
  results: {
    category: DocCategory;
    confidence: number;
    matches: string[];
  }[];
  reasoning?: string;
  processingTimeMs: number;
  method: "ai" | "ai-vision" | "keyword-fallback";
}

interface AIClassifyResponse {
  predicted: DocCategory;
  confidences: Record<DocCategory, number>;
  reasoning: string;
  matchedKeywords: string[];
}

// Even distribution across all 11 categories sums to 1.0 — used when parse fails.
const FALLBACK_CONFIDENCES = Object.fromEntries(
  DOC_CATEGORIES.map((cat) => [cat, cat === "อื่นๆ" ? 1 : 0])
) as Record<DocCategory, number>;

const FALLBACK_RESPONSE: AIClassifyResponse = {
  predicted: "อื่นๆ",
  confidences: FALLBACK_CONFIDENCES,
  reasoning: "ไม่สามารถวิเคราะห์ได้ — fallback",
  matchedKeywords: [],
};

// ── AI Classifier ──────────────────────────────

function buildSystemPrompt(): string {
  return `คุณเป็นผู้เชี่ยวชาญด้านการจำแนกประเภทเอกสารราชการของสำนักงานตำรวจแห่งชาติ
ภารกิจ: อ่านเอกสาร แล้วจำแนกประเภทเข้า ๑ ใน ๑๑ หมวด ตามประเภทงาน (TOR EOP ข้อ ๔)

หมวดงาน ๑๐ หมวดเฉพาะ + "อื่นๆ" สำหรับเอกสารทั่วไป:

${DOC_CATEGORIES.map(
    (c, i) =>
      `${i + 1}. **${c}** — keywords: ${CATEGORY_KEYWORDS[c].join(", ")}`
  ).join("\n")}

หลักการตัดสินใจ (สำคัญ — อ่านก่อนตอบ):
1. **พยายามจัดเข้า ๑๐ หมวดเฉพาะก่อน** ถ้าเนื้อหาเกี่ยวข้องกับงานปฏิบัติของตำรวจ — เช่น เอกสารเรื่อง "การจับกุม/สืบสวน/ดำเนินคดี" = งานปราบปรามอาชญากรรม แม้จะเป็นแค่ "รายงานผล" ก็ตาม
2. **"อื่นๆ" ใช้เฉพาะกรณีที่เนื้อหาไม่ใช่งานปฏิบัติเฉพาะของตำรวจ** เช่น แผนยุทธศาสตร์ระดับองค์กร, ระเบียบพัสดุ, หนังสือเวียนทั่วไป, รายงานวิจัยเชิงวิชาการ, บันทึกประชุมบริหาร
3. **พิจารณาเนื้อหาทั้งหมด** ไม่ใช่แค่หัวข้อหรือชื่อไฟล์
4. **ถ้าเข้าได้หลายหมวด** ให้เลือกหมวดที่ "ใจความสำคัญหลัก" อยู่ และให้คะแนนหมวดรองที่ ๐.๑–๐.๓
5. **predicted ต้องตรงกับหมวดที่ confidences สูงสุดเสมอ**

ตัวอย่างเส้นทางการตัดสินใจ:
- "รายงานจับกุมแก๊งคอลเซ็นเตอร์" → งานปราบปรามอาชญากรรม (ไม่ใช่ "อื่นๆ" เพียงเพราะเป็นรายงาน)
- "แผนสายตรวจชุมชน" → งานป้องกันอาชญากรรม
- "สถิติอุบัติเหตุสงกรานต์" → งานจราจรและอุบัติเหตุ
- "รายงานประจำปี ตร." → อื่นๆ (เป็นเอกสารบริหารระดับองค์กร)
- "ระเบียบพัสดุ" → อื่นๆ (เป็นระเบียบทั่วไป ไม่เกี่ยวกับงานปฏิบัติเฉพาะ)`;
}

const JSON_SCHEMA_BLOCK = `{
  "predicted": "<หนึ่งใน ๑๑ หมวด ตามรายชื่อใน system prompt>",
  "confidences": {
${DOC_CATEGORIES.map((c) => `    "${c}": 0.0-1.0`).join(",\n")}
  },
  "reasoning": "เหตุผลที่จำแนกเข้าหมวดนี้ (๑-๒ ประโยค)",
  "matchedKeywords": ["keyword1", "keyword2", ...]
}

หมายเหตุ: confidences ทุกหมวดรวมแล้วต้องเท่ากับ 1.0`;

function buildUserPrompt(text: string, filename?: string): string {
  const truncated = text.length > 6000 ? text.slice(0, 6000) + "\n[...truncated]" : text;

  return `${filename ? `## ชื่อไฟล์\n${filename}\n\n` : ""}## เนื้อหาเอกสาร
${truncated}

---

ตอบกลับเป็น JSON เท่านั้น ตาม schema:

${JSON_SCHEMA_BLOCK}`;
}

function buildPdfUserPrompt(filename: string): string {
  return `## ชื่อไฟล์
${filename}

อ่านเนื้อหาในเอกสาร PDF ข้างต้น แล้วจำแนกประเภทเข้า ๑ ใน ๑๑ หมวด ตามที่ระบุใน system prompt

ตอบกลับเป็น JSON เท่านั้น ตาม schema:

${JSON_SCHEMA_BLOCK.replace(
    `"reasoning": "เหตุผลที่จำแนกเข้าหมวดนี้ (๑-๒ ประโยค)"`,
    `"reasoning": "เหตุผลที่จำแนกเข้าหมวดนี้ (๑-๒ ประโยค) — อ้างถึงเนื้อหาในเอกสาร"`
  )}`;
}

export async function classifyWithAI(
  text: string,
  filename?: string
): Promise<ClassifyResult> {
  const start = Date.now();

  let client;
  try {
    client = getClaude();
  } catch {
    return keywordClassify(text, start);
  }

  try {
    const response = await client.messages.create({
      model: MODELS.OPUS, // ← highest-accuracy model
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(text, filename) }],
    });

    return parseClassifierResponse(response, start, "ai");
  } catch {
    return keywordClassify(text, start);
  }
}

/**
 * Classify a PDF directly by passing it to Claude vision.
 * Most accurate for scanned PDFs but uses more tokens.
 */
export async function classifyPDFWithAI(
  base64Pdf: string,
  filename: string
): Promise<ClassifyResult> {
  const start = Date.now();

  let client;
  try {
    client = getClaude();
  } catch {
    return keywordClassify("", start);
  }

  try {
    const response = await client.messages.create({
      model: MODELS.OPUS,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            } as unknown as Anthropic.ContentBlockParam,
            {
              type: "text",
              text: buildPdfUserPrompt(filename),
            },
          ],
        },
      ],
    });

    return parseClassifierResponse(response, start, "ai-vision");
  } catch {
    return keywordClassify("", start);
  }
}

function parseClassifierResponse(
  response: Anthropic.Message,
  start: number,
  method: "ai" | "ai-vision"
): ClassifyResult {
  const block = response.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") {
    return keywordClassify("", start);
  }

  const parsed = parseClaudeJson<AIClassifyResponse>(block.text, FALLBACK_RESPONSE);

  if (!DOC_CATEGORIES.includes(parsed.predicted)) {
    return keywordClassify("", start);
  }

  const results = DOC_CATEGORIES.map((cat) => ({
    category: cat,
    confidence: Number((parsed.confidences[cat] ?? 0).toFixed(3)),
    matches: [] as string[],
  })).sort((a, b) => b.confidence - a.confidence);

  results[0].matches = parsed.matchedKeywords ?? [];

  return {
    predicted: parsed.predicted,
    predictedConfidence: results[0].confidence,
    results,
    reasoning: parsed.reasoning,
    processingTimeMs: Date.now() - start,
    method,
  };
}

// ── Keyword-based fallback ─────────────────────

function keywordClassify(text: string, start: number): ClassifyResult {
  const lower = text.toLowerCase();
  const scores: { category: DocCategory; matches: string[]; score: number }[] = [];

  for (const cat of DOC_CATEGORIES) {
    const kws = CATEGORY_KEYWORDS[cat];
    const matches: string[] = [];
    let raw = 0;
    for (const kw of kws) {
      const occurrences = lower.split(kw.toLowerCase()).length - 1;
      if (occurrences > 0) {
        matches.push(kw);
        raw += occurrences * 2;
      }
    }
    scores.push({ category: cat, matches, score: raw + 0.05 });
  }

  const total = scores.reduce((a, s) => a + s.score, 0);
  const results = scores
    .map((s) => ({
      category: s.category,
      confidence: Number((s.score / total).toFixed(3)),
      matches: s.matches,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    predicted: results[0].category,
    predictedConfidence: results[0].confidence,
    results,
    reasoning: "Keyword-based scoring (AI ไม่พร้อม)",
    processingTimeMs: Date.now() - start,
    method: "keyword-fallback",
  };
}
