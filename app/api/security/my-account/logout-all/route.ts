// POST /api/security/my-account/logout-all — invalidate all sessions of current user

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const deleted = await prisma.session.deleteMany({
    where: { userId: session.user.id },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "user.session.logout-all",
      target: `user:${session.user.id}`,
      details: { count: deleted.count },
    },
  });

  return NextResponse.json({ success: true, count: deleted.count });
}
