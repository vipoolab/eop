// Plan Import — File text extraction
// TOR 5.4.1 ๑.๑.๒ Structured Data import for แผน 3 ระดับ

import mammoth from "mammoth";

// ImportFormat ต้องตรงกับ enum ใน schema.prisma (EXCEL, CSV, JSON, PDF, DOCX)
export type ImportFormat = "PDF" | "DOCX";

export function detectFormat(filename: string, mimeType: string): ImportFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "PDF";
  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  throw new Error("รองรับเฉพาะไฟล์ PDF / DOCX");
}

/** Extract plain text from a file buffer. Truncate to ~30,000 chars for AI cost control. */
export async function extractText(
  buffer: Buffer,
  format: ImportFormat
): Promise<string> {
  let text = "";

  if (format === "DOCX") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (format === "PDF") {
    // pdf-parse v2: class-based API
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      text = result.text;
    } finally {
      await parser.destroy();
    }
  }

  // Normalize whitespace + truncate
  text = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const MAX_CHARS = 30000;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + "\n\n[…ตัดทอน]";
  }

  return text;
}
