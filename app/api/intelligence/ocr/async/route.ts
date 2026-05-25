// POST /api/intelligence/ocr/async — background OCR

import { NextRequest, NextResponse } from "next/server";
import { performOCR } from "@/lib/intelligence/ocr";
import type { OcrFileType } from "@/lib/intelligence/ocr";
import { createTask, runInBackground } from "@/lib/tasks/store";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

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
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { success: false, message: "ต้องส่งเป็น multipart/form-data" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const groundTruth = formData.get("groundTruth");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: "ไม่พบไฟล์" }, { status: 400 });
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return NextResponse.json(
      { success: false, message: `ไม่รองรับ ${file.name}` },
      { status: 400 }
    );
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ success: false, message: "ไฟล์ใหญ่เกิน 20MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const gt = typeof groundTruth === "string" && groundTruth.trim() ? groundTruth : undefined;

  const persona = getActivePersona();

  const task = createTask({
    type: "ocr",
    title: `OCR: ${file.name}`,
    input: { filename: file.name, fileType, hasGroundTruth: !!gt },
    createdBy: persona.id,
  });
  task.resultHref = `/tasks/${task.id}`;

  runInBackground(task.id, async () => {
    const result = await performOCR({
      filename: file.name,
      fileType,
      base64,
      groundTruth: gt,
    });
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  });

  return NextResponse.json({
    success: true,
    data: { taskId: task.id, message: "OCR กำลังทำงานเบื้องหลัง — สามารถไปหน้าอื่นได้" },
  });
}
