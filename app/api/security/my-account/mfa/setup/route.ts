// POST /api/security/my-account/mfa/setup — generate secret + return QR
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMfaSecret, buildOtpAuthUrl, buildQrCodeDataUrl } from "@/features/security/mfa";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, mfaEnabled: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, message: "ไม่พบบัญชี" }, { status: 404 });
  }
  if (user.mfaEnabled) {
    return NextResponse.json(
      { success: false, message: "MFA เปิดอยู่แล้ว — ปิดก่อนถึงเปิดใหม่ได้" },
      { status: 400 }
    );
  }

  const secret = generateMfaSecret();
  const otpAuthUrl = buildOtpAuthUrl(user.email, secret);
  const qrUrl = await buildQrCodeDataUrl(otpAuthUrl);

  // Store secret temporarily — only finalize when verify success
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecret: secret },
  });

  return NextResponse.json({
    success: true,
    data: { secret, qrUrl, otpAuthUrl },
  });
}
