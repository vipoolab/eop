// POST /api/intelligence/classify/batch
// Multipart form-data with multiple DOCX/PDF/TXT files
// Returns: per-file classification + summary stats
//
// PDF strategy (for max accuracy):
//   1. Try pdf-parse to extract text (fast, free)
//   2. If text >= 300 chars → classify text (text-based PDF)
//   3. If text < 300 chars → use AI Vision on the PDF directly (scanned PDF)

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { classifyWithAI, classifyPDFWithAI } from "@/lib/intelligence/classifier";
import type { ClassifyResult } from "@/lib/intelligence/classifier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // up to 5 min for 16 files

interface BatchFileResult {
  filename: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  ok: true;
  result: ClassifyResult;
}

interface BatchFileError {
  filename: string;
  ok: false;
  error: string;
}

type BatchEntry = BatchFileResult | BatchFileError;

interface ExtractResult {
  text: string;
  needsVision: boolean; // true if PDF has no extractable text (scanned)
  fileType: string;
}

async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, needsVision: false, fileType: "DOCX" };
  }
  if (name.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      const result = await parser.getText();
      await parser.destroy();
      // result.text is the concatenated text across all pages
      const text = ((result as { text?: string }).text ?? "").trim();
      const needsVision = text.length < 300;
      return { text, needsVision, fileType: "PDF" };
    } catch {
      // pdf-parse failed (encrypted/scanned) → fall back to vision
      return { text: "", needsVision: true, fileType: "PDF" };
    }
  }
  if (name.endsWith(".txt") || name.endsWith(".text")) {
    return { text: new TextDecoder("utf-8").decode(bytes), needsVision: false, fileType: "TXT" };
  }
  if (name.endsWith(".md")) {
    return { text: new TextDecoder("utf-8").decode(bytes), needsVision: false, fileType: "MD" };
  }
  throw new Error(`รองรับเฉพาะ .pdf, .docx, .txt, .md (ไฟล์นี้: ${file.name})`);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files").filter((f) => f instanceof File) as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, message: "ต้องอัปโหลดไฟล์อย่างน้อย ๑ ไฟล์" },
      { status: 400 }
    );
  }

  if (files.length > 30) {
    return NextResponse.json(
      { success: false, message: "อัปโหลดได้ครั้งละไม่เกิน ๓๐ ไฟล์" },
      { status: 400 }
    );
  }

  const start = Date.now();
  const entries: BatchEntry[] = [];
  // Lower concurrency to 3 (PDFs use more tokens — avoid rate limits)
  const CONCURRENCY = 3;

  async function processFile(file: File): Promise<BatchEntry> {
    try {
      const { text, needsVision, fileType } = await extractText(file);
      const bytes = await file.arrayBuffer();

      let result: ClassifyResult;
      if (needsVision && fileType === "PDF") {
        // Scanned PDF → use vision directly
        const base64 = Buffer.from(bytes).toString("base64");
        result = await classifyPDFWithAI(base64, file.name);
      } else {
        // Text available → use text classifier
        if (!text.trim()) {
          return { filename: file.name, ok: false, error: "ไม่สามารถดึงข้อความจากไฟล์ได้" };
        }
        result = await classifyWithAI(text, file.name);
      }

      return {
        filename: file.name,
        fileSize: file.size,
        fileType,
        textLength: text.length,
        ok: true,
        result,
      };
    } catch (e) {
      return {
        filename: file.name,
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const slice = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(slice.map(processFile));
    entries.push(...results);
  }

  const totalMs = Date.now() - start;

  // Summary stats
  const successful = entries.filter((e): e is BatchFileResult => e.ok);
  const failed = entries.filter((e) => !e.ok).length;
  const byCategory: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  for (const e of successful) {
    byCategory[e.result.predicted] = (byCategory[e.result.predicted] ?? 0) + 1;
    byMethod[e.result.method] = (byMethod[e.result.method] ?? 0) + 1;
  }
  const avgConfidence =
    successful.length > 0
      ? successful.reduce((a, e) => a + e.result.predictedConfidence, 0) / successful.length
      : 0;

  return NextResponse.json({
    success: true,
    data: {
      entries,
      summary: {
        total: files.length,
        successful: successful.length,
        failed,
        byCategory,
        byMethod,
        avgConfidence: Number(avgConfidence.toFixed(3)),
        totalMs,
        avgMsPerFile: successful.length > 0 ? Math.round(totalMs / successful.length) : 0,
      },
    },
  });
}
