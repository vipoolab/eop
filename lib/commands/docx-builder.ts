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
// Thai-distributed justified body paragraph(s) with first-line indent (~2.5em ≈ 1.25cm).
// THAI_DISTRIBUTE spreads the slack across Thai characters (not just the few ASCII
// spaces), so lines stay flush on both edges WITHOUT the giant word-gaps that plain
// JUSTIFIED produces on space-sparse Thai text — matching real ตร. คำสั่ง.
//
// `bodyParas` splits the input on blank lines so the AI's "background ... \n\n purpose"
// becomes TWO properly-indented paragraphs (real ตร. คำสั่ง separates เหตุผล from
// วัตถุประสงค์ on different ย่อหน้า).
function oneBody(text: string) {
  return new Paragraph({
    alignment: AlignmentType.THAI_DISTRIBUTE,
    indent: { firstLine: convertMillimetersToTwip(12.5) },
    spacing: { after: 120, line: 276, lineRule: "auto" }, // line 276/240 ≈ 1.15
    children: [run(text)],
  });
}
function bodyParas(text: string): Paragraph[] {
  return text
    .split(/\n\s*\n/) // blank-line separator → new paragraph
    .map((t) => t.trim())
    .filter(Boolean)
    .map(oneBody);
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

  // ── เส้นคั่น ──
  if (letter.dividerStyle === "asterisks") {
    children.push(center("******************************", { spaceAfter: 120 }));
  } else if (letter.dividerStyle === "underline") {
    // Short centered horizontal rule under "เรื่อง" — matches ตร. ๔๑๙/๒๕๕๖.
    // Em-dashes connect seamlessly in TH SarabunPSK to form a continuous line.
    children.push(center("—".repeat(25), { spaceAfter: 120 }));
  }

  // ── เนื้อหา ──
  if (letter.objective) children.push(...bodyParas(letter.objective));
  if (letter.legalBasis) children.push(...bodyParas(letter.legalBasis));
  // legacy fallback
  if (!letter.objective && !letter.legalBasis && letter.introduction) {
    children.push(...bodyParas(letter.introduction));
  }
  for (const d of letter.directives ?? []) children.push(...bodyParas(d));
  if (letter.isAmendment) children.push(oneBody("นอกนั้นให้เป็นไปตามคำสั่งเดิมทุกประการ"));
  if (letter.effectiveClause) children.push(...bodyParas(letter.effectiveClause));
  if (!letter.effectiveClause && letter.closing) children.push(...bodyParas(letter.closing));

  // ── สั่ง ณ วันที่ (centered) ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 360, line: 276, lineRule: "auto" },
      children: [run(`สั่ง ณ วันที่ ${dateStr}`)],
    })
  );

  // ── บล็อกลงนาม (centered) ──
  // Two modes:
  //   (a) Signed/dispatched — show signature text + actual rank/name/title.
  //   (b) Draft (default) — show a blank fill-in template so whoever later
  //       prints the order can sign by hand. We don't know the signer at draft
  //       time, so populating it would be misleading.
  if (letter.signatureApplied && letter.signatureText) {
    children.push(center(`(ลงนาม) ${letter.signatureText}`));
    if (letter.signerRank) children.push(center(letter.signerRank));
    if (letter.signerName) children.push(center(`(${letter.signerName})`));
    if (letter.signerTitle) children.push(center(letter.signerTitle));
  } else {
    const dots = ".".repeat(40);
    children.push(center("(ลายมือชื่อ)"));
    children.push(center(dots));
    children.push(center(dots));
    children.push(center(dots));
  }

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
