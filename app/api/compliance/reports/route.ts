// /api/compliance/reports — POST create, GET list

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/features/compliance/validators";
import { createReport, ComplianceError } from "@/features/compliance/service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
      },
      { status: 400 }
    );
  }
  try {
    const r = await createReport(parsed.data, {
      id: session.user.id,
      role: session.user.role as
        | "ADMIN"
        | "COMMANDER"
        | "STAFF"
        | "AUDITOR"
        | "VIEWER",
    });
    return NextResponse.json({ success: true, data: r });
  } catch (err) {
    if (err instanceof ComplianceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "สร้างไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const items = await prisma.complianceReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      template: { select: { code: true, name: true, standard: true } },
      unit: { select: { code: true, name: true } },
      createdBy: { select: { name: true, rank: true } },
      reviewer: { select: { name: true, rank: true } },
      _count: { select: { answers: true } },
    },
  });
  return NextResponse.json({ success: true, data: items });
}
