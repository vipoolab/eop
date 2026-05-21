// POST /api/security/my-account/mfa/verify — verify TOTP + enable MFA
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp, generateRecoveryCodes } from "@/features/security/mfa";

const schema = z.object({ token: z.string().length(6) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "กรอก code 6 หลัก" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, mfaSecret: true, mfaEnabled: true },
  });
  if (!user?.mfaSecret) {
    return NextResponse.json({ success: false, message: "ต้องเริ่ม setup ก่อน" }, { status: 400 });
  }

  if (!verifyTotp(parsed.data.token, user.mfaSecret)) {
    return NextResponse.json(
      { success: false, message: "Code ไม่ถูกต้อง — ลองอีกครั้ง" },
      { status: 400 }
    );
  }

  // Generate recovery codes
  const { plain, hashes } = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: true,
      mfaEnabledAt: new Date(),
      mfaRecoveryCodes: hashes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "user.mfa.enable",
      target: `user:${user.id}`,
    },
  });

  return NextResponse.json({
    success: true,
    data: { recoveryCodes: plain },
  });
}
