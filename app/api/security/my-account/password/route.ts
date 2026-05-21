// POST /api/security/my-account/password — change password (TOR ๗.๑.๒)

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(8, "รหัสผ่านใหม่ต้อง ≥ 8 ตัวอักษร"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, message: "ไม่พบบัญชี" }, { status: 404 });
  }

  const valid = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(parsed.data.next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "user.password.change",
      target: `user:${user.id}`,
    },
  });

  return NextResponse.json({ success: true });
}
