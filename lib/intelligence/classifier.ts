// AI Doc Classifier — classifies Thai government documents into 6 categories
// using the best available model. Falls back to keyword scoring if AI is unavailable.
//
// Supports:
//  - Plain text input (fastest)
//  - PDF via vision input (most accurate for scanned PDFs)

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import {
  DOC_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_KEYWORDS,
} from "./types";
import type { DocCategory } from "./types";
import type Anthropic from "@anthropic-ai/sdk";

export interface ClassifyResult {
  predicted: DocCategory;
  predictedConfidence: number;
  results: {
    category: DocCategory;
    categoryDescription: string;
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

const FALLBACK_RESPONSE: AIClassifyResponse = {
  predicted: "อจ.",
  confidences: { "ยศ.": 0, "ผบ.": 0, "มค.": 0, "มข.": 0, "วจ.": 0, "อจ.": 1 },
  reasoning: "ไม่สามารถวิเคราะห์ได้ — fallback",
  matchedKeywords: [],
};

// ── AI Classifier ──────────────────────────────

function buildSystemPrompt(): string {
  return `คุณเป็นผู้เชี่ยวชาญด้านการจำแนกประเภทเอกสารราชการ ของสำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.)
ภารกิจ: อ่านเอกสาร แล้วจำแนกประเภทเข้า ๑ ใน ๖ หมวด ตามลักษณะเนื้อหา:

${DOC_CATEGORIES.map(
    (c) =>
      `- **${c}** (${CATEGORY_DESCRIPTIONS[c]}) — keywords ที่บ่งชี้: ${CATEGORY_KEYWORDS[c].join(", ")}`
  ).join("\n")}

หลักการ:
- พิจารณาเนื้อหาทั้งหมด ไม่ใช่แค่หัวข้อ
- เอกสารที่มี keywords ของหลายหมวด ให้เลือกหมวดที่ "ใจความสำคัญหลัก" อยู่
- เอกสารวางแผน ตัวชี้วัด ยุทธศาสตร์ → ยศ.
- เอกสารบริหารทั่วไป คำสั่ง ระเบียบงาน → ผบ.
- เอกสารด้านความมั่นคง การข่าวกรอง ก่อการร้าย → มค.
- เอกสารด้านปราบปราม ยาเสพติด ภารกิจพิเศษ → มข.
- เอกสารด้านวิจัย การศึกษา ข้อมูลสถิติ → วจ.
- เอกสารธุรการทั่วไป บันทึกข้อความ เวียน → อจ.
- เมื่อไม่แน่ใจ ให้คะแนนกระจายอย่างสมเหตุสมผล (เช่น 0.55/0.30/0.10/0.05/...)`;
}

function buildUserPrompt(text: string, filename?: string): string {
  const truncated = text.length > 6000 ? text.slice(0, 6000) + "\n[...truncated]" : text;

  return `${filename ? `## ชื่อไฟล์\n${filename}\n\n` : ""}## เนื้อหาเอกสาร
${truncated}

---

ตอบกลับเป็น JSON เท่านั้น ตาม schema:

{
  "predicted": "<หมวดที่ทำนาย: ยศ./ผบ./มค./มข./วจ./อจ.>",
  "confidences": {
    "ยศ.": 0.0-1.0,
    "ผบ.": 0.0-1.0,
    "มค.": 0.0-1.0,
    "มข.": 0.0-1.0,
    "วจ.": 0.0-1.0,
    "อจ.": 0.0-1.0
  },
  "reasoning": "เหตุผลที่จำแนกเข้าหมวดนี้ (๑-๒ ประโยค)",
  "matchedKeywords": ["keyword1", "keyword2", ...]
}

หมายเหตุ: confidences ทุกหมวดรวมแล้วต้องเท่ากับ 1.0`;
}

function buildPdfUserPrompt(filename: string): string {
  return `## ชื่อไฟล์
${filename}

อ่านเนื้อหาในเอกสาร PDF ข้างต้น แล้วจำแนกประเภทเข้า ๑ ใน ๖ หมวด ตามที่ระบุใน system prompt

ตอบกลับเป็น JSON เท่านั้น ตาม schema:

{
  "predicted": "<หมวดที่ทำนาย: ยศ./ผบ./มค./มข./วจ./อจ.>",
  "confidences": {
    "ยศ.": 0.0-1.0,
    "ผบ.": 0.0-1.0,
    "มค.": 0.0-1.0,
    "มข.": 0.0-1.0,
    "วจ.": 0.0-1.0,
    "อจ.": 0.0-1.0
  },
  "reasoning": "เหตุผลที่จำแนกเข้าหมวดนี้ (๑-๒ ประโยค) — อ้างถึงเนื้อหาในเอกสาร",
  "matchedKeywords": ["keyword จากเอกสาร 1", "keyword 2", ...]
}

หมายเหตุ: confidences ทุกหมวดรวมแล้วต้องเท่ากับ 1.0`;
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
      model: MODELS.OPUS, // ← upgraded to highest-accuracy model
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
    return keywordClassify("", start); // empty fallback
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
    categoryDescription: CATEGORY_DESCRIPTIONS[cat],
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
      categoryDescription: CATEGORY_DESCRIPTIONS[s.category],
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
