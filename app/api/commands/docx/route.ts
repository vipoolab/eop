// POST /api/commands/docx — build & return a .docx of the given คำสั่ง letter.
// Accepts { letter: CommandLetter, signedDate?: string } and streams back a
// Word document (editable, TH SarabunPSK, A4) for download.

import { NextRequest, NextResponse } from "next/server";
import { buildCommandDocx } from "@/lib/commands/docx-builder";
import type { CommandLetter } from "@/lib/commands/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const letter = body?.letter as CommandLetter | undefined;

  if (!letter || !letter.subject) {
    return NextResponse.json(
      { success: false, message: "ต้องส่ง letter (อย่างน้อยต้องมี subject)" },
      { status: 400 }
    );
  }

  const buffer = await buildCommandDocx(letter, body?.signedDate);

  // Filename: คำสั่ง_<subject>.docx (URL-encoded for the header)
  const subjectClean = (letter.subject ?? "คำสั่ง")
    .replace(/^\s*เรื่อง\s*/, "")
    .slice(0, 60)
    .replace(/[\\/:*?"<>|]/g, "_");
  const filename = `คำสั่ง_${subjectClean}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
