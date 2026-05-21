// POST /api/users/[id]/reset-password — Admin reset user password
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  newPassword: z.string().min(8).max(72),
  mustChangeOnNext: z.boolean().default(true),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "เฉพาะ ADMIN" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "รหัสผ่านต้อง ≥ 8 ตัวอักษร" }, { status: 400 });
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: hash,
      mustChangePassword: parsed.data.mustChangeOnNext,
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  // Invalidate all sessions of that user
  await prisma.session.deleteMany({ where: { userId: id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "admin.user.password.reset",
      target: `user:${id}`,
      details: { mustChangeOnNext: parsed.data.mustChangeOnNext },
    },
  });

  return NextResponse.json({ success: true });
}
