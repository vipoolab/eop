// POST /api/ai/ocr — Image → Thai text via Claude Vision

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { performOcr } from "@/features/ai/ocr";

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

  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return NextResponse.json(
      {
        success: false,
        message: "รองรับเฉพาะ JPG / PNG",
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await performOcr({
      imageBuffer: buffer,
      mimeType: file.type as "image/jpeg" | "image/png",
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ai.ocr",
        target: `image:${file.name}`,
        details: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          detectedLines: result.detectedLines,
          confidence: result.confidence,
          tokensUsed: result.tokensUsed,
          elapsedMs: result.elapsedMs,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        filename: file.name,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("OCR failed:", err);
    const msg = err instanceof Error ? err.message : "OCR ไม่สำเร็จ";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
