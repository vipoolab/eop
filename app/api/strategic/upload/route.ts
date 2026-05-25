// POST /api/strategic/upload — upload PDF + parse with Claude Opus

import { NextRequest, NextResponse } from "next/server";
import {
  addDocument,
  addItems,
  deleteDocument,
  deleteItemsForDocument,
  getNationalStrategy,
  getDocument,
} from "@/lib/strategic/store";
import { parsePlanDocument, flattenParsedItems } from "@/lib/strategic/parser";
import type { PlanDocument, PlanLevel } from "@/lib/strategic/types";

export const runtime = "nodejs";
export const maxDuration = 120; // up to 2 min for Claude Opus

function genDocId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const levelRaw = formData.get("level");
  const parentDocId = (formData.get("parentDocId") as string | null) || null;
  const replaceExistingLevel1 = formData.get("replaceLevel1") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { success: false, message: "รองรับเฉพาะไฟล์ PDF เท่านั้น" },
      { status: 400 }
    );
  }

  const level = Number(levelRaw) as PlanLevel;
  if (![1, 2, 3].includes(level)) {
    return NextResponse.json(
      { success: false, message: "level ต้องเป็น 1, 2 หรือ 3" },
      { status: 400 }
    );
  }

  // Validate parent relationship
  if (level === 2 || level === 3) {
    if (!parentDocId) {
      return NextResponse.json(
        {
          success: false,
          message:
            level === 2
              ? "แผนระดับ 2 ต้องระบุยุทธศาสตร์ชาติเป็น parent"
              : "แผนระดับ 3 ต้องระบุแผนแม่บทเป็น parent",
        },
        { status: 400 }
      );
    }
    const parent = getDocument(parentDocId);
    if (!parent) {
      return NextResponse.json(
        { success: false, message: "ไม่พบเอกสาร parent ที่ระบุ" },
        { status: 400 }
      );
    }
    if (parent.level !== level - 1) {
      return NextResponse.json(
        {
          success: false,
          message: `parent ต้องเป็นเอกสารระดับ ${level - 1}`,
        },
        { status: 400 }
      );
    }
  }

  // Level 1 singleton — must explicitly replace
  if (level === 1) {
    const existing = getNationalStrategy();
    if (existing && !replaceExistingLevel1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "มียุทธศาสตร์ชาติ (ระดับ 1) อยู่แล้ว — ต้องส่ง replaceLevel1=true เพื่อแทนที่",
          existingId: existing.id,
        },
        { status: 409 }
      );
    }
  }

  // Read file into buffer
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  // Call Claude Opus
  const parseOutcome = await parsePlanDocument({
    level,
    pdfBuffer: buffer,
    fileName: file.name,
  });

  if (!parseOutcome.ok) {
    return NextResponse.json(
      {
        success: false,
        message: parseOutcome.error,
        durationMs: parseOutcome.durationMs,
      },
      { status: 500 }
    );
  }

  // Replace existing level 1 if needed
  if (level === 1) {
    const existing = getNationalStrategy();
    if (existing) {
      deleteItemsForDocument(existing.id);
      deleteDocument(existing.id);
    }
  }

  // Create document record
  const docId = genDocId();
  const doc: PlanDocument = {
    id: docId,
    level,
    title: parseOutcome.result.title,
    description: parseOutcome.result.description,
    metadata: parseOutcome.result.metadata,
    parentDocId: level === 1 ? null : parentDocId,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: "demo-user",
    parseStatus: "PARSED",
    parsedAt: new Date().toISOString(),
    parsedBy: parseOutcome.model,
    parseTokens: parseOutcome.inputTokens + parseOutcome.outputTokens,
    parseDurationMs: parseOutcome.durationMs,
  };
  addDocument(doc);

  // Flatten + save items
  const items = flattenParsedItems(docId, parseOutcome.result.items);
  addItems(items);

  return NextResponse.json({
    success: true,
    data: {
      document: doc,
      itemCount: items.length,
      durationMs: parseOutcome.durationMs,
      tokens: {
        input: parseOutcome.inputTokens,
        output: parseOutcome.outputTokens,
      },
    },
  });
}
