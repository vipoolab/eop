// POST /api/ai/classify — Upload + AI Classify Document
// Returns: classification result + saves to DB

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  classifyDocument,
  extractTextFromBuffer,
  isSupportedMime,
} from "@/features/ai/doc-classify";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  if (!["ADMIN", "COMMANDER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "คุณไม่มีสิทธิ์ใช้งานฟีเจอร์นี้" },
      { status: 403 }
    );
  }

  // Parse multipart form
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        message: `ไฟล์ใหญ่เกินกำหนด (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
      },
      { status: 400 }
    );
  }

  if (!isSupportedMime(file.type)) {
    return NextResponse.json(
      {
        success: false,
        message: `ไม่รองรับไฟล์ประเภท ${file.type} — รองรับ DOCX / PDF / JPG / PNG / TXT`,
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Extract text (for docx/txt) or pass through (for pdf/img)
    const extracted = await extractTextFromBuffer(buffer, file.type);

    // 2. Classify via Claude
    const isPdf = file.type === "application/pdf";
    const isImage =
      file.type === "image/jpeg" || file.type === "image/png";

    const result = await classifyDocument({
      filename: file.name,
      text: extracted.text || undefined,
      pdfBuffer: isPdf ? buffer : undefined,
      imageBuffer: isImage ? buffer : undefined,
      imageMime: isImage ? (file.type as "image/jpeg" | "image/png") : undefined,
    });

    // 3. Save to DB (Document table)
    const doc = await prisma.document.create({
      data: {
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath: "memory:", // No actual storage in this PoC
        uploadedById: session.user.id,
        classifiedUnit: result.unitCode,
        classificationConfidence: result.confidence,
        classificationAt: new Date(),
        contentText: result.extractedText.slice(0, 5000),
      },
    });

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ai.document.classify",
        target: `document:${doc.id}`,
        details: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          extractMethod: extracted.method,
          unitCode: result.unitCode,
          confidence: result.confidence,
          tokensUsed: result.tokensUsed,
          elapsedMs: result.elapsedMs,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        documentId: doc.id,
        ...result,
        extractedMethod: extracted.method,
        size: file.size,
        filename: file.name,
      },
    });
  } catch (err) {
    console.error("Classify failed:", err);
    const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
