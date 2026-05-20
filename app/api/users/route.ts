// GET/POST /api/users — Admin user management (TOR 7.1.1)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  rank: z.string().max(50).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(["ADMIN", "COMMANDER", "STAFF", "AUDITOR", "VIEWER"]),
  unitId: z.string().optional(),
  mfaEnabled: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "COMMANDER"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      rank: true,
      role: true,
      active: true,
      mfaEnabled: true,
      unit: { select: { code: true, name: true } },
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "เฉพาะ ADMIN เท่านั้น" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return NextResponse.json(
      { success: false, message: "อีเมลนี้ถูกใช้แล้ว" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      rank: parsed.data.rank,
      passwordHash,
      role: parsed.data.role,
      unitId: parsed.data.unitId,
      mfaEnabled: parsed.data.mfaEnabled,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "user.create",
      target: `user:${user.id}`,
      details: { email: user.email, role: user.role },
    },
  });

  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
