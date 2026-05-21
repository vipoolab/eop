// /api/compliance/templates/[id] — GET/PATCH/DELETE

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  id: z.string().optional(), // existing item id (or undefined for new)
  code: z.string().min(1).max(50),
  category: z.string().min(1).max(100),
  question: z.string().min(5).max(2000),
  weight: z.number().min(0.1).max(10).default(1.0),
  order: z.number().int().min(0).default(0),
  evidenceRequired: z.boolean().default(false),
});

const patchSchema = z.object({
  standard: z.enum(["GOR_POR_ROR", "ITA", "PMQA", "GOV4_0", "CUSTOM"]).optional(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(3).max(200).optional(),
  version: z.string().min(1).max(20).optional(),
  effectiveDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
  items: z.array(itemSchema).optional(),
});

export async function GET(
  _: Request,
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
  const tpl = await prisma.complianceTemplate.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      _count: { select: { reports: true } },
    },
  });
  if (!tpl) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ template" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: tpl });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  if (!["ADMIN", "COMMANDER"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "เฉพาะ ADMIN / COMMANDER แก้ template ได้" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.complianceTemplate.findUnique({
    where: { id },
    select: { id: true, _count: { select: { reports: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ template" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
      },
      { status: 400 }
    );
  }

  const usedInReports = existing._count.reports > 0;

  // If template used in reports, only allow updating metadata; reject item changes
  if (usedInReports && parsed.data.items) {
    return NextResponse.json(
      {
        success: false,
        message: `Template ใช้ในรายงาน ${existing._count.reports} ฉบับแล้ว — แก้ checklist ไม่ได้ ให้ clone version ใหม่แทน`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.complianceTemplate.update({
      where: { id },
      data: {
        ...(parsed.data.standard !== undefined && { standard: parsed.data.standard }),
        ...(parsed.data.code !== undefined && { code: parsed.data.code }),
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.version !== undefined && { version: parsed.data.version }),
        ...(parsed.data.effectiveDate !== undefined && {
          effectiveDate: parsed.data.effectiveDate,
        }),
        ...(parsed.data.active !== undefined && { active: parsed.data.active }),
      },
    });

    if (parsed.data.items) {
      // Replace-all strategy (like Form Builder)
      await tx.complianceChecklistItem.deleteMany({ where: { templateId: id } });
      if (parsed.data.items.length > 0) {
        await tx.complianceChecklistItem.createMany({
          data: parsed.data.items.map((it, idx) => ({
            templateId: id,
            code: it.code,
            category: it.category,
            question: it.question,
            weight: it.weight,
            order: it.order ?? idx,
            evidenceRequired: it.evidenceRequired,
          })),
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "compliance.template.update",
        target: `complianceTemplate:${id}`,
        details: {
          changes: Object.keys(parsed.data),
          itemCount: parsed.data.items?.length,
        },
      },
    });

    return t;
  });

  return NextResponse.json({ success: true, data: updated });
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
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "เฉพาะ ADMIN ลบ template ได้" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.complianceTemplate.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { reports: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ template" },
      { status: 404 }
    );
  }
  if (existing._count.reports > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Template ถูกใช้ในรายงาน ${existing._count.reports} ฉบับ — ลบไม่ได้ (ปิดใช้งานแทน)`,
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.complianceChecklistItem.deleteMany({ where: { templateId: id } }),
    prisma.complianceTemplate.delete({ where: { id } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "compliance.template.delete",
        target: `complianceTemplate:${id}`,
        details: { name: existing.name },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
