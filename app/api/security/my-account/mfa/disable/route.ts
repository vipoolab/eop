// POST /api/security/my-account/mfa/disable
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaEnabledAt: null,
      mfaRecoveryCodes: [],
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "user.mfa.disable",
      target: `user:${session.user.id}`,
    },
  });

  return NextResponse.json({ success: true });
}
