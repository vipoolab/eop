// /api/incidents — POST create + GET list

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createIncidentSchema } from "@/features/incidents/validators";
import { createIncident, IncidentError } from "@/features/incidents/service";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  try {
    const inc = await createIncident(parsed.data, {
      id: session.user.id,
      role: session.user.role as Role,
    });
    return NextResponse.json({ success: true, data: inc });
  } catch (err) {
    if (err instanceof IncidentError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    console.error(err);
    return NextResponse.json({ success: false, message: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const type = sp.get("type");

  const incidents = await prisma.incident.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { reportedAt: "desc" },
    take: 100,
    include: {
      assignedUnit: { select: { code: true, name: true } },
      respondedBy: { select: { name: true, rank: true } },
      mission: { select: { code: true, title: true } },
      command: { select: { docNo: true, subject: true } },
      _count: { select: { afterActionReviews: true, attachments: true } },
    },
  });

  return NextResponse.json({ success: true, data: incidents });
}
