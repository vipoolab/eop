// Test OCR with PDF input — wrap test-thai-doc.png in a PDF via pdf-lib

import { config } from "dotenv";
config({ override: true });

import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("📄 Building PDF from existing test-thai-doc.png...");
  const pngPath = join(process.cwd(), "scripts", "test-thai-doc.png");
  const pngBytes = readFileSync(pngPath);

  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const pdfBytes = await pdfDoc.save();
  const outPath = join(process.cwd(), "scripts", "test-doc.pdf");
  writeFileSync(outPath, pdfBytes);
  console.log(`   ✓ Saved to ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)\n`);

  console.log("🤖 Calling Claude OCR on PDF...");
  const { performOcr } = await import("../features/ai/ocr");
  const result = await performOcr({
    fileBuffer: Buffer.from(pdfBytes),
    mimeType: "application/pdf",
  });

  console.log(`   ✓ Model: ${result.model}`);
  console.log(`   ✓ Pages: ${result.pages}`);
  console.log(`   ✓ Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`   ✓ Lines: ${result.detectedLines}`);
  console.log(`   ✓ Tokens: ${result.tokensUsed}`);
  console.log(`   ✓ Elapsed: ${(result.elapsedMs / 1000).toFixed(1)}s\n`);

  console.log("📝 Extracted:");
  console.log("─".repeat(70));
  console.log(result.text);
  console.log("─".repeat(70));

  if (result.reasoning) {
    console.log("\n💬 AI reasoning:", result.reasoning);
  }
}

main().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
