// GET /api/security/my-account/export — Right to Data Portability (PDPA)
// Export ข้อมูลส่วนตัวของ user เอง (excluding password hash, mfaSecret)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, rank: true, position: true, badgeNo: true,
      role: true, active: true, mfaEnabled: true, mfaEnabledAt: true,
      lastLoginAt: true, createdAt: true, updatedAt: true,
      unit: { select: { code: true, name: true } },
    },
  });

  const [sessions, loginAttempts, consents, auditLog] = await Promise.all([
    prisma.session.findMany({
      where: { userId: session.user.id },
      select: { token: true, expires: true, createdAt: true },
    }),
    prisma.loginAttempt.findMany({
      where: { email: user?.email ?? "" },
      take: 100,
      select: { success: true, failReason: true, ipAddress: true, userAgent: true, createdAt: true },
    }),
    prisma.consentRecord.findMany({ where: { userId: session.user.id } }),
    prisma.auditLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { action: true, target: true, ip: true, createdAt: true },
    }),
  ]);

  // Audit the export
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "user.data.export",
      target: `user:${session.user.id}`,
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    sessions: sessions.map((s) => ({ ...s, token: s.token.slice(0, 16) + "…" })),
    loginAttempts,
    consents,
    auditLog,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="eop-mydata-${session.user.id}.json"`,
    },
  });
}
