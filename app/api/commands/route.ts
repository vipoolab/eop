// /api/commands — GET list + POST create
// TOR 5.4.4 Command & Operation System

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCommandSchema,
  listCommandsSchema,
} from "@/features/commands/validators";
import { createCommand, ServiceError } from "@/features/commands/service";
import { listCommands } from "@/features/commands/repository";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const parsed = listCommandsSchema.safeParse({
    status: sp.get("status") || undefined,
    priority: sp.get("priority") || undefined,
    search: sp.get("search") || undefined,
    page: sp.get("page") || undefined,
    pageSize: sp.get("pageSize") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "พารามิเตอร์ไม่ถูกต้อง",
        errors: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { status, priority, search, page, pageSize } = parsed.data;

  const where: Parameters<typeof listCommands>[0]["where"] = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { docNo: { contains: search } },
      { recipient: { contains: search, mode: "insensitive" } },
    ];
  }

  const { items, total } = await listCommands({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createCommandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const command = await createCommand(parsed.data, {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name || "Unknown",
    });

    return NextResponse.json(
      { success: true, data: command },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    console.error("Failed to create command:", err);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
