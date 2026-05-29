// Real Thai OCR using Claude vision (PDF + image)
// Uses Claude Opus 4.7 — highest accuracy for Thai script.

import { getClaude, MODELS } from "@/lib/claude";

export type OcrFileType = "PDF" | "PNG" | "JPG" | "JPEG" | "WEBP";

export interface OcrInput {
  filename: string;
  fileType: OcrFileType;
  /** Base64 (without data: prefix) */
  base64: string;
  /** Optional ground truth for CER calculation */
  groundTruth?: string;
}

export interface OcrOutput {
  ok: true;
  filename: string;
  fileType: OcrFileType;
  extractedText: string;
  charCount: number;
  wordCount: number;
  /** Character Error Rate (0-1) — only computed if groundTruth provided */
  cer?: number;
  /** Accuracy = 1 - CER */
  accuracy?: number;
  /** AI's self-reported confidence */
  confidence: number;
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  language: string;
  model: string;
}

export interface OcrFail {
  ok: false;
  error: string;
  processingTimeMs: number;
}

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญ OCR ภาษาไทยระดับโลก ที่ทำงานกับเอกสารราชการของสำนักงานตำรวจแห่งชาติเป็นประจำ

ภารกิจ: อ่านเนื้อหาในเอกสาร PDF/ภาพ แล้วถอดความเป็นข้อความ Plain Text ภาษาไทยให้ถูกต้องที่สุด

หลักการ:
- เก็บลำดับและโครงสร้างเอกสาร (หัวกระดาษ, ย่อหน้า, ข้อย่อย, ตาราง)
- รักษาเลขข้อ ๑./๒./๓. แบบที่อยู่ในเอกสาร — ถ้าใช้เลขอารบิก ก็คงเลขอารบิก ถ้าใช้เลขไทย ก็คงเลขไทย
- คั่นย่อหน้าด้วย newline ๒ ครั้ง (\\n\\n)
- ข้อย่อย ๑./๒./๓. ขึ้นบรรทัดใหม่
- รักษาสัญลักษณ์ราชการ เช่น ๒๕๖๙, ที่ ตร. ........., เรียน, อ้างถึง
- ถ้ามีลายเซ็น ตำแหน่ง ใต้ลายเซ็น ให้เขียนติดท้ายเอกสาร
- ถ้าอ่านไม่ออก/เลือนลาง ให้ใส่ [...] แทน ห้ามเดา
- ห้ามแปลภาษา ห้ามตีความ เก็บข้อความตามต้นฉบับ

Output: ส่งกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่นนอก JSON) ตาม schema:
{
  "text": "<ข้อความที่อ่านได้ทั้งหมด>",
  "confidence": 0.0-1.0,
  "notes": "<หมายเหตุถ้ามี เช่น 'ส่วนล่างเลือนลาง', 'พบลายเซ็น'>"
}`;

interface OcrAIResponse {
  text: string;
  confidence: number;
  notes?: string;
}

function getMediaType(fileType: OcrFileType): string {
  switch (fileType) {
    case "PDF":
      return "application/pdf";
    case "PNG":
      return "image/png";
    case "JPG":
    case "JPEG":
      return "image/jpeg";
    case "WEBP":
      return "image/webp";
  }
}

// Strip code fences from JSON response
function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// Salvage the `text` field from a near-JSON response that JSON.parse couldn't
// handle. Common causes:
//   • Long Thai text with literal newlines / unescaped quotes inside the
//     `text` value.
//   • Response truncated mid-stream by max_tokens — no closing `"` ever
//     appears, so the strict regex won't match.
// Returns the bare OCR content — NEVER the {"text":"..."} envelope — so the
// user always sees clean document text in the UI.
function salvageOcrResponse(raw: string): OcrAIResponse {
  // Path A: well-shaped envelope (just unescaped chars inside text).
  const tidy = raw.match(
    /"text"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:confidence|notes)"|"\s*\}\s*$)/
  );
  if (tidy) {
    const confMatch = raw.match(/"confidence"\s*:\s*([\d.]+)/);
    return {
      text: unescapeJsonString(tidy[1]).trim(),
      confidence: confMatch ? parseFloat(confMatch[1]) : 0.85,
      notes: "JSON parse failed — extracted via wrapper-strip",
    };
  }

  // Path B: severely malformed / truncated. Strip whatever envelope we can
  // see, leaving the document content. We never want the literal characters
  // `{"text":"` or `","confidence":...}` to reach the UI.
  let stripped = raw.trim();
  stripped = stripped.replace(/^\s*\{\s*"text"\s*:\s*"/, ""); // leading wrapper
  stripped = stripped.replace(/"\s*,\s*"(?:confidence|notes)"\s*:[\s\S]*$/, ""); // trailing metadata
  stripped = stripped.replace(/"\s*\}\s*$/, ""); // bare closing
  return {
    text: unescapeJsonString(stripped).trim(),
    confidence: 0.85,
    notes: "OCR response was truncated/malformed; envelope stripped",
  };
}

export async function performOCR(input: OcrInput): Promise<OcrOutput | OcrFail> {
  const start = Date.now();

  let client;
  try {
    client = getClaude();
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message,
      processingTimeMs: Date.now() - start,
    };
  }

  try {
    const mediaType = getMediaType(input.fileType);
    const isPdf = input.fileType === "PDF";

    const response = await client.messages.create({
      model: MODELS.OPUS,
      // 16k gives ~16k chars of headroom for Thai OCR (each Thai char ≈ 1 token);
      // 8k was getting truncated on long documents and the truncated response
      // bypassed the strict-shape regex in salvageOcrResponse.
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: isPdf ? "document" : "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: input.base64,
              },
            } as Anthropic.ContentBlockParam,
            {
              type: "text",
              text: `กรุณา OCR เอกสารนี้ และส่งกลับเป็น JSON ตาม schema ที่กำหนด`,
            },
          ],
        },
      ],
    });

    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      return {
        ok: false,
        error: "AI ไม่ได้คืน text content",
        processingTimeMs: Date.now() - start,
      };
    }

    let parsed: OcrAIResponse;
    const cleaned = stripFences(block.text);
    try {
      parsed = JSON.parse(cleaned) as OcrAIResponse;
    } catch {
      // Long Thai text often has unescaped newlines/quotes that break
      // JSON.parse. Salvage just the inner `text` field by regex so the
      // user never sees the {"text":"..."} envelope in the UI.
      parsed = salvageOcrResponse(cleaned);
    }

    const text = parsed.text ?? "";
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Compute CER if groundTruth provided
    let cer: number | undefined;
    let accuracy: number | undefined;
    if (input.groundTruth) {
      cer = computeCER(text, input.groundTruth);
      accuracy = Number((1 - cer).toFixed(4));
      cer = Number(cer.toFixed(4));
    }

    return {
      ok: true,
      filename: input.filename,
      fileType: input.fileType,
      extractedText: text,
      charCount,
      wordCount,
      cer,
      accuracy,
      confidence: parsed.confidence ?? 0.92,
      processingTimeMs: Date.now() - start,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      language: "th-TH",
      model: "ai-engine",
    };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message,
      processingTimeMs: Date.now() - start,
    };
  }
}

// ── CER (Character Error Rate) using Levenshtein ─────

/**
 * Compute Character Error Rate between hypothesis (OCR output) and reference (ground truth).
 * CER = (Substitutions + Deletions + Insertions) / Reference_length
 *
 * Uses Levenshtein distance algorithm.
 */
export function computeCER(hypothesis: string, reference: string): number {
  if (!reference) return 0;

  // Normalize whitespace (don't penalize for spacing)
  const h = hypothesis.replace(/\s+/g, " ").trim();
  const r = reference.replace(/\s+/g, " ").trim();

  if (!r) return 0;
  if (!h) return 1;

  const distance = levenshtein(h, r);
  return distance / r.length;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use Uint16Array for memory efficiency (Thai docs can be long)
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Re-export Anthropic types via namespace for clarity
import type Anthropic from "@anthropic-ai/sdk";
export type { Anthropic };
