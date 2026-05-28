// POST /api/commands/docx — build & return a .docx of the given คำสั่ง letter.
// Accepts { letter: CommandLetter, signedDate?: string } and streams back a
// Word document (editable, TH SarabunPSK, A4) for download.

import { NextRequest, NextResponse } from "next/server";
import { buildCommandDocx } from "@/lib/commands/docx-builder";
import { getActivePersona, getUnit } from "@/lib/police-org/store";
import { expandRank, expandTitle, stripRankFromName } from "@/lib/commands/signer-format";
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

  // Enrich with persona-derived header + signature fields (mirrors the commit
  // route at app/api/commands/route.ts so the downloaded docx already shows
  // the real signer instead of "(ลายมือชื่อ) / (ชื่อ-นามสกุลผู้สั่งการ)" placeholders).
  try {
    const persona = getActivePersona();
    if (persona) {
      const unit = getUnit(persona.unitId);
      letter.unitFullName = letter.unitFullName ?? unit?.name ?? "สำนักงานตำรวจแห่งชาติ";
      // Use FULL rank/title and strip rank prefix off the name — matches ตร. ๔๑๙
      // ("พลตำรวจเอก" / "(อดุลย์ แสงสิงแก้ว)" / "ผู้บัญชาการตำรวจแห่งชาติ").
      letter.signerRank = letter.signerRank ?? expandRank(persona.rank);
      letter.signerName = letter.signerName ?? stripRankFromName(persona.name);
      letter.signerTitle = letter.signerTitle ?? expandTitle(persona.role);
      const isStation = (unit?.level ?? 0) >= 3;
      letter.dateStyle = letter.dateStyle ?? (isStation ? "full" : "abbreviated");
      // HQ default = underline (ตร. ๔๑๙); station = asterisks
      letter.dividerStyle = letter.dividerStyle ?? (isStation ? "asterisks" : "underline");
    }
  } catch {
    // persona store failed — render the letter as-is with placeholders
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
