// POST /api/intelligence/ocr — REAL OCR using Claude vision
// Multipart form-data with:
//   - file: File (PDF, PNG, JPG, JPEG, WEBP)
//   - groundTruth?: string (for CER calculation)

import { NextRequest, NextResponse } from "next/server";
import { performOCR } from "@/lib/intelligence/ocr";
import type { OcrFileType } from "@/lib/intelligence/ocr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel Hobby plan caps maxDuration at 60s. PDF page batching is done client-side
// (see commit bef37a2) so per-batch should fit comfortably.
export const maxDuration = 60;

function detectFileType(filename: string, mimeType: string): OcrFileType | null {
  const name = filename.toLowerCase();
  if (name.endsWith(".pdf") || mimeType === "application/pdf") return "PDF";
  if (name.endsWith(".png") || mimeType === "image/png") return "PNG";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || mimeType === "image/jpeg") return "JPG";
  if (name.endsWith(".webp") || mimeType === "image/webp") return "WEBP";
  return null;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // Support multipart (file upload) only — JSON path removed (was mock)
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { success: false, message: "ต้องส่งเป็น multipart/form-data พร้อมไฟล์" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const groundTruth = formData.get("groundTruth");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "ไม่พบไฟล์ที่อัปโหลด (key: file)" },
      { status: 400 }
    );
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return NextResponse.json(
      {
        success: false,
        message: `ไม่รองรับไฟล์ ${file.name} — รับเฉพาะ PDF, PNG, JPG, WEBP`,
      },
      { status: 400 }
    );
  }

  // Limit file size to 20MB (Claude API limit)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, message: "ไฟล์ใหญ่เกิน 20MB" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const result = await performOCR({
    filename: file.name,
    fileType,
    base64,
    groundTruth: typeof groundTruth === "string" && groundTruth.trim() ? groundTruth : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: result.error,
        processingTimeMs: result.processingTimeMs,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: result });
}
