// GET /api/reports/export?code=... — Generate PDF report

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/features/reports/export";
import { findReportByCode } from "@/features/reports/catalog";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const meta = findReportByCode(code);

  if (!meta) {
    return NextResponse.json(
      { success: false, message: "ไม่พบรายงาน" },
      { status: 404 }
    );
  }

  try {
    const pdfBytes = await generateReportPdf({
      code,
      name: meta.name,
      framework: meta.framework,
      period: meta.period,
      deadline: meta.deadline,
      progress: meta.progress,
      indicators: meta.indicators,
      preparedBy: `${session.user.rank ?? ""} ${session.user.name}`.trim(),
      preparedAt: new Date(),
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "report.export.pdf",
        target: `report:${code}`,
        details: { framework: meta.framework, name: meta.name },
      },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${code}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export failed:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
