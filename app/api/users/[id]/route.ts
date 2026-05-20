// PATCH/DELETE /api/users/[id] — User toggle/delete

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "เฉพาะ ADMIN เท่านั้น" },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (!action || !["activate", "deactivate", "enable_mfa", "disable_mfa"].includes(action)) {
    return NextResponse.json(
      { success: false, message: "action ต้องเป็น activate/deactivate/enable_mfa/disable_mfa" },
      { status: 400 }
    );
  }

  const data: { active?: boolean; mfaEnabled?: boolean } = {};
  if (action === "activate") data.active = true;
  if (action === "deactivate") data.active = false;
  if (action === "enable_mfa") data.mfaEnabled = true;
  if (action === "disable_mfa") data.mfaEnabled = false;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, active: true, mfaEnabled: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: `user.${action}`,
      target: `user:${id}`,
      details: { email: user.email },
    },
  });

  return NextResponse.json({ success: true, data: user });
}
