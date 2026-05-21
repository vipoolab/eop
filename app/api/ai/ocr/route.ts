// POST /api/ai/ocr — Image/PDF → Thai text via Claude Vision

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { performOcr, isOcrSupported } from "@/features/ai/ocr";

export const runtime = "nodejs";
export const maxDuration = 90; // bigger PDFs take longer

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

  if (!isOcrSupported(file.type)) {
    return NextResponse.json(
      {
        success: false,
        message: "รองรับเฉพาะ JPG / PNG / PDF",
      },
      { status: 400 }
    );
  }

  // TOR ๘.๑๐.๓ — PDF page count guard (Vercel function timeout limit)
  // Claude vision ใช้เวลา ~5-10s/หน้า; Vercel hobby plan timeout 60s
  const MAX_PDF_PAGES = 5;
  if (file.type === "application/pdf") {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const tmp = await PDFDocument.load(await file.arrayBuffer());
      const pageCount = tmp.getPageCount();
      if (pageCount > MAX_PDF_PAGES) {
        return NextResponse.json(
          {
            success: false,
            message: `PDF มี ${pageCount} หน้า — เกินขีดจำกัด ${MAX_PDF_PAGES} หน้าต่อครั้ง (กันเซิร์ฟเวอร์ timeout). กรุณาแยกไฟล์เป็นชุดที่หน้าน้อยกว่า`,
          },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error("PDF page check failed:", e);
      // Allow to continue — Claude may still handle it
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await performOcr({
      fileBuffer: buffer,
      mimeType: file.type as "image/jpeg" | "image/png" | "application/pdf",
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ai.ocr",
        target: `file:${file.name}`,
        details: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          detectedLines: result.detectedLines,
          pages: result.pages,
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
