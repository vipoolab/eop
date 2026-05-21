// POST /api/security/my-account/consent — toggle PDPA consent

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  consentType: z.enum(["PERSONAL_DATA", "LOCATION", "BIOMETRIC", "ANALYTICS"]),
  granted: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const existing = await prisma.consentRecord.findFirst({
    where: { userId: session.user.id, consentType: parsed.data.consentType },
  });

  if (existing) {
    await prisma.consentRecord.update({
      where: { id: existing.id },
      data: {
        granted: parsed.data.granted,
        grantedAt: parsed.data.granted ? new Date() : existing.grantedAt,
        revokedAt: parsed.data.granted ? null : new Date(),
      },
    });
  } else {
    await prisma.consentRecord.create({
      data: {
        userId: session.user.id,
        consentType: parsed.data.consentType,
        granted: parsed.data.granted,
        version: "PDPA-v1",
        grantedAt: parsed.data.granted ? new Date() : null,
        revokedAt: parsed.data.granted ? null : new Date(),
        ipAddress,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: `consent.${parsed.data.granted ? "grant" : "revoke"}`,
      target: `consent:${parsed.data.consentType}`,
      details: { consentType: parsed.data.consentType },
    },
  });

  return NextResponse.json({ success: true });
}
