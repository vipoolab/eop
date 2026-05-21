// POST /api/compliance/templates/[id]/clone — copy template + items to new version

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const cloneSchema = z.object({
  code: z.string().min(1).max(50),
  version: z.string().min(1).max(20),
  effectiveDate: z.coerce.date(),
});

export async function POST(
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
      { success: false, message: "เฉพาะ ADMIN / COMMANDER clone template ได้" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = cloneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
      },
      { status: 400 }
    );
  }

  const src = await prisma.complianceTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!src) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ template ต้นฉบับ" },
      { status: 404 }
    );
  }

  // Check uniqueness
  const dup = await prisma.complianceTemplate.findUnique({
    where: { code: parsed.data.code },
  });
  if (dup) {
    return NextResponse.json(
      { success: false, message: `รหัส ${parsed.data.code} ซ้ำ` },
      { status: 400 }
    );
  }

  const cloned = await prisma.$transaction(async (tx) => {
    const newTpl = await tx.complianceTemplate.create({
      data: {
        standard: src.standard,
        code: parsed.data.code,
        name: `${src.name} (v${parsed.data.version})`,
        version: parsed.data.version,
        effectiveDate: parsed.data.effectiveDate,
      },
    });
    if (src.items.length > 0) {
      await tx.complianceChecklistItem.createMany({
        data: src.items.map((it) => ({
          templateId: newTpl.id,
          code: it.code,
          category: it.category,
          question: it.question,
          weight: it.weight,
          order: it.order,
          evidenceRequired: it.evidenceRequired,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "compliance.template.clone",
        target: `complianceTemplate:${newTpl.id}`,
        details: { sourceId: src.id, itemCount: src.items.length },
      },
    });
    return newTpl;
  });

  return NextResponse.json({ success: true, data: cloned });
}
