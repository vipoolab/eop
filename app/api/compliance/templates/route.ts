// /api/compliance/templates — POST create, GET list

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTemplateSchema,
  checklistItemSchema,
} from "@/features/compliance/validators";
import { createTemplate, ComplianceError } from "@/features/compliance/service";

const fullSchema = createTemplateSchema.extend({
  items: z.array(checklistItemSchema).default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = fullSchema.safeParse(body);
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
    const { items, ...rest } = parsed.data;
    const tpl = await createTemplate(rest, items, {
      id: session.user.id,
      role: session.user.role as
        | "ADMIN"
        | "COMMANDER"
        | "STAFF"
        | "AUDITOR"
        | "VIEWER",
    });
    return NextResponse.json({ success: true, data: tpl });
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
  const items = await prisma.complianceTemplate.findMany({
    where: { active: true },
    orderBy: [{ standard: "asc" }, { effectiveDate: "desc" }],
    include: { _count: { select: { items: true, reports: true } } },
  });
  return NextResponse.json({ success: true, data: items });
}
