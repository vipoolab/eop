// GET /api/reports/export?code=... — Generate PDF report

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/features/reports/export";

// Hardcoded report definitions (matches /compliance/reports page)
const REPORTS: Record<string, { name: string; framework: string; period: string; deadline: string; progress: number; indicators: number }> = {
  "GPR-Q2-2569": {
    name: "Performance Report Q2/2569",
    framework: "ก.พ.ร.",
    period: "Apr-Jun 2569",
    deadline: "15 Jul 2569",
    progress: 78,
    indicators: 12,
  },
  "ITA-2569": {
    name: "Integrity & Transparency Assessment",
    framework: "ITA",
    period: "FY 2569",
    deadline: "30 Sep 2569",
    progress: 45,
    indicators: 28,
  },
  "PMQA-2568": {
    name: "Public Management Quality Award",
    framework: "PMQA",
    period: "FY 2568",
    deadline: "Submitted",
    progress: 100,
    indicators: 7,
  },
  "OPDC-2569": {
    name: "OPDC Annual Report",
    framework: "OPDC",
    period: "FY 2569",
    deadline: "30 Oct 2569",
    progress: 22,
    indicators: 18,
  },
  "GPR-Q1-2569": {
    name: "Performance Report Q1/2569",
    framework: "ก.พ.ร.",
    period: "Oct-Dec 2568",
    deadline: "Approved",
    progress: 100,
    indicators: 12,
  },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const meta = REPORTS[code];

  if (!meta) {
    return NextResponse.json(
      { success: false, message: "ไม่พบรายงาน" },
      { status: 404 }
    );
  }

  try {
    const pdfBytes = await generateReportPdf({
      code,
      ...meta,
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
