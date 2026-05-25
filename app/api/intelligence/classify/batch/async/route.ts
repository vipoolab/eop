// POST /api/intelligence/classify/batch/async
// Same as /api/intelligence/classify/batch but kicks off in background → returns taskId immediately.

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import {
  classifyWithAI,
  classifyPDFWithAI,
} from "@/lib/intelligence/classifier";
import type { ClassifyResult } from "@/lib/intelligence/classifier";
import { createTask, runInBackground, setTaskProgress } from "@/lib/tasks/store";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

interface BatchFileResult {
  filename: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  ok: true;
  result: ClassifyResult;
}

interface BatchFileError {
  filename: string;
  ok: false;
  error: string;
}

type BatchEntry = BatchFileResult | BatchFileError;

interface ExtractResult {
  text: string;
  needsVision: boolean;
  fileType: string;
}

async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, needsVision: false, fileType: "DOCX" };
  }
  if (name.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      const result = await parser.getText();
      await parser.destroy();
      const text = ((result as { text?: string }).text ?? "").trim();
      const needsVision = text.length < 300;
      return { text, needsVision, fileType: "PDF" };
    } catch {
      return { text: "", needsVision: true, fileType: "PDF" };
    }
  }
  if (name.endsWith(".txt") || name.endsWith(".text")) {
    return { text: new TextDecoder("utf-8").decode(bytes), needsVision: false, fileType: "TXT" };
  }
  if (name.endsWith(".md")) {
    return { text: new TextDecoder("utf-8").decode(bytes), needsVision: false, fileType: "MD" };
  }
  throw new Error(`รองรับเฉพาะ .pdf, .docx, .txt, .md (ไฟล์นี้: ${file.name})`);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files").filter((f) => f instanceof File) as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, message: "ต้องอัปโหลดไฟล์อย่างน้อย ๑ ไฟล์" },
      { status: 400 }
    );
  }

  if (files.length > 30) {
    return NextResponse.json(
      { success: false, message: "อัปโหลดได้ครั้งละไม่เกิน ๓๐ ไฟล์" },
      { status: 400 }
    );
  }

  // Snapshot files into Buffers so the task can use them after response sent
  const snapshots = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      bytes: Buffer.from(await f.arrayBuffer()),
    }))
  );

  const persona = getActivePersona();

  // Create task
  const task = createTask<{ filenames: string[] }, {
    entries: BatchEntry[];
    summary: Record<string, unknown>;
  }>({
    type: "classify-batch",
    title: `จำแนก ${snapshots.length} ไฟล์ — ${snapshots.slice(0, 2).map((s) => s.name).join(", ")}${snapshots.length > 2 ? "..." : ""}`,
    input: { filenames: snapshots.map((s) => s.name) },
    createdBy: persona.id,
  });

  // Update task with result href
  task.resultHref = `/tasks/${task.id}`;

  // Kick off background job
  runInBackground(task.id, async () => {
    const start = Date.now();
    const entries: BatchEntry[] = [];
    const CONCURRENCY = 3;

    async function processFile(snap: { name: string; size: number; type: string; bytes: Buffer }): Promise<BatchEntry> {
      try {
        // Wrap snapshot back as File-like object for extractText
        const fileLike = new File([new Uint8Array(snap.bytes)], snap.name, { type: snap.type });
        const { text, needsVision, fileType } = await extractText(fileLike);

        let result: ClassifyResult;
        if (needsVision && fileType === "PDF") {
          const base64 = snap.bytes.toString("base64");
          result = await classifyPDFWithAI(base64, snap.name);
        } else {
          if (!text.trim()) {
            return { filename: snap.name, ok: false, error: "ไม่สามารถดึงข้อความจากไฟล์ได้" };
          }
          result = await classifyWithAI(text, snap.name);
        }

        return {
          filename: snap.name,
          fileSize: snap.size,
          fileType,
          textLength: text.length,
          ok: true,
          result,
        };
      } catch (e) {
        return { filename: snap.name, ok: false, error: (e as Error).message };
      }
    }

    let processed = 0;
    for (let i = 0; i < snapshots.length; i += CONCURRENCY) {
      const slice = snapshots.slice(i, i + CONCURRENCY);
      const results = await Promise.all(slice.map(processFile));
      entries.push(...results);
      processed += slice.length;
      setTaskProgress(task.id, {
        step: processed,
        totalSteps: snapshots.length,
        label: `ประมวลผล ${processed}/${snapshots.length} ไฟล์`,
        percent: Math.round((processed / snapshots.length) * 100),
      });
    }

    const totalMs = Date.now() - start;
    const successful = entries.filter((e): e is BatchFileResult => e.ok);
    const failed = entries.filter((e) => !e.ok).length;
    const byCategory: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    for (const e of successful) {
      byCategory[e.result.predicted] = (byCategory[e.result.predicted] ?? 0) + 1;
      byMethod[e.result.method] = (byMethod[e.result.method] ?? 0) + 1;
    }
    const avgConfidence =
      successful.length > 0
        ? successful.reduce((a, e) => a + e.result.predictedConfidence, 0) / successful.length
        : 0;

    return {
      entries,
      summary: {
        total: snapshots.length,
        successful: successful.length,
        failed,
        byCategory,
        byMethod,
        avgConfidence: Number(avgConfidence.toFixed(3)),
        totalMs,
        avgMsPerFile: successful.length > 0 ? Math.round(totalMs / successful.length) : 0,
      },
    };
  });

  return NextResponse.json({
    success: true,
    data: { taskId: task.id, message: "งานจำแนกเอกสารกำลังทำงานเบื้องหลัง — สามารถไปหน้าอื่นได้" },
  });
}
