// GET /api/strategic/document/[id] — get single doc with items
// DELETE /api/strategic/document/[id] — delete

import { NextRequest, NextResponse } from "next/server";
import {
  getDocument,
  getItemsForDocument,
  buildItemTree,
  getChildDocuments,
  deleteDocument,
  deleteItemsForDocument,
} from "@/lib/strategic/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ success: false, message: "ไม่พบเอกสาร" }, { status: 404 });
  }
  const items = getItemsForDocument(id);
  const itemTree = buildItemTree(items);
  const children = getChildDocuments(id);
  return NextResponse.json({
    success: true,
    data: {
      document: doc,
      items: itemTree,
      childDocs: children,
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ success: false, message: "ไม่พบเอกสาร" }, { status: 404 });
  }
  // Protect seed
  if (doc.isSeed) {
    return NextResponse.json(
      { success: false, message: "ลบเอกสารตัวอย่างไม่ได้ — ใช้ reset เพื่อรีเซ็ตข้อมูล" },
      { status: 403 }
    );
  }
  deleteItemsForDocument(id);
  deleteDocument(id);
  return NextResponse.json({ success: true });
}
