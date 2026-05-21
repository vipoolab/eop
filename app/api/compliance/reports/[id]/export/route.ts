// GET /api/compliance/reports/[id]/export — PDF export of report

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportPdf } from "@/features/reports/export";
import { calculateReportScore, STANDARD_LABELS, type ComplianceStandard } from "@/features/compliance/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const r = await prisma.complianceReport.findUnique({
    where: { id },
    include: {
      template: { include: { items: true } },
      unit: true,
      createdBy: true,
      approver: { select: { name: true, rank: true, position: true } },
      answers: { include: { item: true } },
    },
  });
  if (!r) {
    return NextResponse.json(
      { success: false, message: "ไม่พบรายงาน" },
      { status: 404 }
    );
  }

  const scoreCalc = calculateReportScore(
    r.template.items.map((it) => {
      const ans = r.answers.find((a) => a.itemId === it.id);
      return {
        weight: it.weight,
        selfScore: ans?.selfScore ?? null,
        reviewerScore: ans?.reviewerScore ?? null,
      };
    })
  );

  const pdfBytes = await generateReportPdf({
    code: r.template.code,
    name: r.template.name,
    framework: STANDARD_LABELS[r.template.standard as ComplianceStandard],
    period: r.period,
    deadline: r.externallySubmittedAt
      ? `ส่งแล้ว ${r.externallySubmittedAt.toLocaleDateString("th-TH")}`
      : "ยังไม่ส่ง",
    progress: Math.round(scoreCalc.percent),
    indicators: r.template.items.length,
    preparedBy: r.createdBy
      ? `${r.createdBy.rank ?? ""} ${r.createdBy.name}`
      : "—",
    preparedAt: r.createdAt,
    approverName: r.approver
      ? `${r.approver.rank ?? ""} ${r.approver.name}`.trim()
      : null,
    approvedAt: r.approvedAt,
    signatureData: r.approverSignature,
    signatureIp: r.signatureIp,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "compliance.report.export",
      target: `complianceReport:${id}`,
      details: { format: "PDF" },
    },
  });

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${r.template.code}-${r.period.replace(/[^\w]+/g, "-")}.pdf"`,
    },
  });
}
