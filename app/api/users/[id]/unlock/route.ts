// POST /api/users/[id]/unlock — Admin unlock account
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "เฉพาะ ADMIN" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await prisma.user.update({
    where: { id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "admin.user.unlock",
      target: `user:${id}`,
    },
  });
  return NextResponse.json({ success: true });
}
