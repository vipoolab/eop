// Build a downloadable .docx of a คำสั่ง, matching the on-screen A4 layout:
//   ตราครุฑ (centered) → คำสั่ง<หน่วย> / ที่ X/Y / เรื่อง → body → สั่ง ณ วันที่ → signature
// Font: TH SarabunPSK 16pt (Word uses the user's installed national font).

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  convertMillimetersToTwip,
} from "docx";
import { readFileSync } from "fs";
import path from "path";
import type { CommandLetter } from "./types";

const FONT = "TH SarabunPSK";
const SIZE = 32; // half-points → 16pt
const THAI_DIGIT = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
function toThai(s: string | number): string {
  return String(s)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGIT[Number(c)] : c))
    .join("");
}
function fmtSignedDate(iso: string, style: "abbreviated" | "full"): string {
  const d = new Date(iso);
  const day = toThai(d.getDate());
  const month = THAI_MONTHS[d.getMonth()];
  const year = toThai(d.getFullYear() + 543);
  return style === "full"
    ? `${day} เดือน ${month} พุทธศักราช ${year}`
    : `${day} ${month} พ.ศ. ${year}`;
}

// One run with the standard font/size
function run(text: string, opts: { bold?: boolean } = {}) {
  return new TextRun({ text, font: FONT, size: SIZE, bold: opts.bold });
}
// Centered single-line paragraph
function center(text: string, opts: { bold?: boolean; spaceAfter?: number } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.spaceAfter ?? 0, line: 276, lineRule: "auto" },
    children: [run(text, { bold: opts.bold })],
  });
}
// Justified body paragraph with first-line indent (~2.5em ≈ 1.25cm)
function body(text: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: convertMillimetersToTwip(12.5) },
    spacing: { after: 120, line: 276, lineRule: "auto" }, // line 276/240 ≈ 1.15
    children: [run(text)],
  });
}

export async function buildCommandDocx(
  letter: CommandLetter,
  signedDate?: string
): Promise<Buffer> {
  const unitName = letter.unitFullName ?? "สำนักงานตำรวจแห่งชาติ";
  const docNumber = letter.docNumber ?? "...../๒๕๖๙";
  const subject = (letter.subject ?? "").replace(/^\s*เรื่อง\s*/, "");
  const dateStyle = letter.dateStyle ?? "abbreviated";
  const dateStr = fmtSignedDate(signedDate ?? new Date().toISOString(), dateStyle);

  const children: Paragraph[] = [];

  // ── ตราครุฑ (centered, ~3cm tall) ──
  try {
    const garudaPath = path.join(process.cwd(), "public", "garuda.png");
    const img = readFileSync(garudaPath);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            data: img,
            type: "png",
            transformation: { width: 113, height: 113 }, // ~3cm @96dpi
          }),
        ],
      })
    );
  } catch {
    // emblem optional — skip if file missing
  }

  // ── หัวเรื่อง (centered) ──
  children.push(center(`คำสั่ง${unitName}`, { bold: true }));
  children.push(center(`ที่ ${docNumber}`));
  const subjFull = `เรื่อง ${subject}${letter.subjectSuffix ? ` ${letter.subjectSuffix}` : ""}`;
  children.push(center(subjFull, { spaceAfter: 120 }));

  // ── เส้นคั่น (asterisks style only) ──
  if (letter.dividerStyle === "asterisks") {
    children.push(center("******************************", { spaceAfter: 120 }));
  }

  // ── เนื้อหา ──
  if (letter.objective) children.push(body(letter.objective));
  if (letter.legalBasis) children.push(body(letter.legalBasis));
  // legacy fallback
  if (!letter.objective && !letter.legalBasis && letter.introduction) {
    children.push(body(letter.introduction));
  }
  for (const d of letter.directives ?? []) children.push(body(d));
  if (letter.isAmendment) children.push(body("นอกนั้นให้เป็นไปตามคำสั่งเดิมทุกประการ"));
  if (letter.effectiveClause) children.push(body(letter.effectiveClause));
  if (!letter.effectiveClause && letter.closing) children.push(body(letter.closing));

  // ── สั่ง ณ วันที่ (centered) ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 360, line: 276, lineRule: "auto" },
      children: [run(`สั่ง ณ วันที่ ${dateStr}`)],
    })
  );

  // ── ลายมือชื่อ (centered) ──
  if (letter.signatureApplied && letter.signatureText) {
    children.push(center(`(ลงนาม) ${letter.signatureText}`));
  } else {
    children.push(center("(ลายมือชื่อ)"));
  }
  if (letter.signerRank) children.push(center(letter.signerRank));
  children.push(center(`(${letter.signerName ?? "ชื่อ-นามสกุลผู้สั่งการ"})`));
  children.push(center(letter.signerTitle ?? "ตำแหน่งผู้สั่งการ"));

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: {
              top: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(30),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
