// /api/compliance/reports/[id] — GET / DELETE

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteReport, ComplianceError } from "@/features/compliance/service";

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
      template: {
        include: { items: { orderBy: { order: "asc" } } },
      },
      unit: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, name: true, rank: true } },
      reviewer: { select: { id: true, name: true, rank: true } },
      answers: {
        include: {
          evidenceDoc: { select: { id: true, filename: true, originalName: true } },
          answeredBy: { select: { name: true, rank: true } },
        },
      },
      scoreLogs: {
        orderBy: { version: "desc" },
        take: 10,
        include: { changedBy: { select: { name: true, rank: true } } },
      },
    },
  });
  if (!r) {
    return NextResponse.json(
      { success: false, message: "ไม่พบรายงาน" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: r });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const { id } = await ctx.params;
  try {
    await deleteReport(id, {
      id: session.user.id,
      role: session.user.role as
        | "ADMIN"
        | "COMMANDER"
        | "STAFF"
        | "AUDITOR"
        | "VIEWER",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ComplianceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "ลบไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
