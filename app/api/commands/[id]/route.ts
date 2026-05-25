import { NextRequest, NextResponse } from "next/server";
import { getCommand, deleteCommand } from "@/lib/commands/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cmd = getCommand(id);
  if (!cmd) {
    return NextResponse.json({ success: false, message: "ไม่พบคำสั่ง" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { command: cmd } });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = deleteCommand(id);
  return NextResponse.json({ success: ok });
}
