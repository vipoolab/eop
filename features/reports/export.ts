// Report Export Service — PDF + DOCX with Thai font support
// TOR 3.1 — Compliance Reports (ก.พ.ร./ITA/PMQA/OPDC)

import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import { join } from "path";

export interface ReportData {
  code: string;
  name: string;
  framework: string;
  period: string;
  deadline: string;
  progress: number;
  indicators: number;
  preparedBy?: string;
  preparedAt?: Date;
}

let cachedFontBytes: Buffer | null = null;
function getThaiFont(): Buffer {
  if (!cachedFontBytes) {
    const fontPath = join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSansThai-Regular.ttf"
    );
    cachedFontBytes = readFileSync(fontPath);
  }
  return cachedFontBytes;
}

export async function generateReportPdf(data: ReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const thaiFont: PDFFont = await pdfDoc.embedFont(getThaiFont(), {
    subset: true,
  });

  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const navy = rgb(30 / 255, 58 / 255, 95 / 255);
  const gold = rgb(184 / 255, 134 / 255, 11 / 255);
  const text = rgb(15 / 255, 23 / 255, 42 / 255);
  const muted = rgb(100 / 255, 116 / 255, 139 / 255);

  // Top + bottom gold bars
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: gold });
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: gold });

  // Header
  page.drawText("ROYAL THAI POLICE", {
    x: 50, y: height - 50, size: 10, font: thaiFont, color: gold,
  });
  page.drawText("สำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.)", {
    x: 50, y: height - 65, size: 11, font: thaiFont, color: muted,
  });
  page.drawText("Enterprise Operation Planning System", {
    x: 50, y: height - 80, size: 9, font: thaiFont, color: muted,
  });

  // Title
  page.drawText("รายงานการประเมินตามมาตรฐาน", {
    x: 50, y: height - 130, size: 20, font: thaiFont, color: navy,
  });
  page.drawText("Compliance Report", {
    x: 50, y: height - 152, size: 12, font: thaiFont, color: muted,
  });

  // Report metadata
  let cursorY = height - 200;
  const drawRow = (label: string, value: string) => {
    page.drawText(label, {
      x: 50, y: cursorY, size: 10, font: thaiFont, color: text,
    });
    page.drawText(value, {
      x: 180, y: cursorY, size: 10, font: thaiFont, color: text,
    });
    cursorY -= 22;
  };

  drawRow("เลขที่รายงาน:", data.code);
  drawRow("ชื่อรายงาน:", data.name);
  drawRow("มาตรฐาน:", data.framework);
  drawRow("ระยะเวลา:", data.period);
  drawRow("กำหนดส่ง:", data.deadline);
  drawRow("จำนวนตัวชี้วัด:", String(data.indicators));
  drawRow("ความก้าวหน้า:", `${data.progress}%`);

  if (data.preparedBy) {
    cursorY -= 10;
    drawRow("จัดทำโดย:", data.preparedBy);
  }
  if (data.preparedAt) {
    drawRow("วันที่จัดทำ:", data.preparedAt.toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
    }));
  }

  // Progress bar
  cursorY -= 25;
  page.drawText("ความก้าวหน้าโดยรวม", {
    x: 50, y: cursorY, size: 11, font: thaiFont, color: text,
  });
  cursorY -= 24;
  page.drawRectangle({
    x: 50, y: cursorY, width: 495, height: 22,
    borderColor: muted, borderWidth: 0.5,
    color: rgb(0.96, 0.96, 0.96),
  });
  page.drawRectangle({
    x: 50, y: cursorY, width: 495 * (data.progress / 100), height: 22,
    color: navy,
  });
  page.drawText(`${data.progress}%`, {
    x: 50 + 495 * (data.progress / 100) - 35, y: cursorY + 7,
    size: 10, font: thaiFont, color: rgb(1, 1, 1),
  });

  // Notes section
  cursorY -= 60;
  page.drawText("หมายเหตุ", {
    x: 50, y: cursorY, size: 11, font: thaiFont, color: navy,
  });
  cursorY -= 20;
  page.drawText(
    "• รายงานนี้สร้างจากระบบ EOP โดยอัตโนมัติ — ข้อมูล ณ วันที่จัดทำ",
    { x: 50, y: cursorY, size: 10, font: thaiFont, color: text }
  );
  cursorY -= 18;
  page.drawText(
    "• สามารถ export PDF / DOCX ส่งหน่วยประเมินภายนอกได้",
    { x: 50, y: cursorY, size: 10, font: thaiFont, color: text }
  );
  cursorY -= 18;
  page.drawText(
    "• เก็บรักษาเป็นเวลา 7 ปี ตามระเบียบสำนักนายกรัฐมนตรี",
    { x: 50, y: cursorY, size: 10, font: thaiFont, color: text }
  );

  // Signature placeholders
  cursorY -= 50;
  page.drawText("ลงนาม", {
    x: 50, y: cursorY, size: 10, font: thaiFont, color: text,
  });
  page.drawLine({
    start: { x: 50, y: cursorY - 5 }, end: { x: 250, y: cursorY - 5 },
    color: muted, thickness: 0.5,
  });
  page.drawText("ผู้จัดทำ", {
    x: 130, y: cursorY - 18, size: 8, font: thaiFont, color: muted,
  });

  page.drawText("ลงนาม", {
    x: 320, y: cursorY, size: 10, font: thaiFont, color: text,
  });
  page.drawLine({
    start: { x: 320, y: cursorY - 5 }, end: { x: 540, y: cursorY - 5 },
    color: muted, thickness: 0.5,
  });
  page.drawText("ผู้อนุมัติ", {
    x: 400, y: cursorY - 18, size: 8, font: thaiFont, color: muted,
  });

  // Footer
  page.drawText(
    "Generated by EOP System · For Official Use Only · Restricted",
    { x: 50, y: 25, size: 8, font: thaiFont, color: muted }
  );
  page.drawText(`© พ.ศ. ${new Date().getFullYear() + 543} สำนักงานตำรวจแห่งชาติ`, {
    x: width - 220, y: 25, size: 8, font: thaiFont, color: muted,
  });

  return pdfDoc.save();
}
