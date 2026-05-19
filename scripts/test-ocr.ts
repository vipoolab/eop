// Test OCR end-to-end:
// 1. Generate a synthetic Thai document image (PNG) via sharp + SVG
// 2. Call performOcr() directly (bypasses HTTP auth)
// 3. Compare AI output vs ground truth

import { config } from "dotenv";
config({ override: true });

import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const GROUND_TRUTH_LINES = [
  "สำนักงานยุทธศาสตร์ตำรวจ",
  "ที่ ตร ๐๐๐๑.๖๙/๐๐๑๒",
  "เรื่อง รายงานผลการปฏิบัติงาน",
  "เรียน ผู้บัญชาการตำรวจแห่งชาติ",
  "ด้วยกองยุทธศาสตร์ตำรวจ ได้ดำเนินการตามแผน",
  "ปฏิบัติราชการประจำปีงบประมาณ ๒๕๖๙",
  "โดยมีผลการดำเนินงานสำคัญดังต่อไปนี้",
];

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="white"/>
  <text x="50" y="60"  font-family="Tahoma" font-size="32" font-weight="bold" fill="black">${GROUND_TRUTH_LINES[0]}</text>
  <text x="50" y="120" font-family="Tahoma" font-size="20" fill="black">${GROUND_TRUTH_LINES[1]}</text>
  <text x="50" y="180" font-family="Tahoma" font-size="22" fill="black">${GROUND_TRUTH_LINES[2]}</text>
  <text x="50" y="220" font-family="Tahoma" font-size="22" fill="black">${GROUND_TRUTH_LINES[3]}</text>
  <text x="50" y="300" font-family="Tahoma" font-size="20" fill="black">${GROUND_TRUTH_LINES[4]}</text>
  <text x="50" y="340" font-family="Tahoma" font-size="20" fill="black">${GROUND_TRUTH_LINES[5]}</text>
  <text x="50" y="380" font-family="Tahoma" font-size="20" fill="black">${GROUND_TRUTH_LINES[6]}</text>
</svg>`;

// CER (Character Error Rate) — Levenshtein-normalized
function cer(reference: string, hypothesis: string): number {
  const r = Array.from(reference);
  const h = Array.from(hypothesis);
  const m = r.length;
  const n = h.length;
  if (m === 0) return n === 0 ? 0 : 1;

  // DP edit distance
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = r[i - 1] === h[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n] / m;
}

async function main() {
  console.log("🖼️  Generating Thai test image via sharp + SVG...");
  const pngBuffer = await sharp(Buffer.from(SVG)).png().toBuffer();
  const outPath = join(process.cwd(), "scripts", "test-thai-doc.png");
  writeFileSync(outPath, pngBuffer);
  console.log(`   ✓ Saved to ${outPath} (${(pngBuffer.length / 1024).toFixed(1)} KB)\n`);

  console.log("🤖 Calling Claude OCR...");
  const { performOcr } = await import("../features/ai/ocr");
  const result = await performOcr({
    imageBuffer: pngBuffer,
    mimeType: "image/png",
  });

  console.log(`   ✓ Model: ${result.model}`);
  console.log(`   ✓ Confidence (AI self-report): ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`   ✓ Detected lines: ${result.detectedLines}`);
  console.log(`   ✓ Tokens: ${result.tokensUsed}`);
  console.log(`   ✓ Elapsed: ${(result.elapsedMs / 1000).toFixed(1)}s\n`);

  console.log("📝 Extracted text:");
  console.log("─".repeat(70));
  console.log(result.text);
  console.log("─".repeat(70));

  // Compute CER per line vs ground truth
  console.log("\n📊 CER (Character Error Rate) vs ground truth:");
  const groundTruth = GROUND_TRUTH_LINES.join("\n");
  const overallCer = cer(groundTruth, result.text.trim());
  console.log(`   • Overall CER: ${(overallCer * 100).toFixed(2)}% (TOR target ≤ 10%)`);
  console.log(`   • Score: ${overallCer <= 0.1 ? "✅ ≤ 10% (10 pt)" : overallCer <= 0.2 ? "🟡 10-20% (5 pt)" : overallCer <= 0.3 ? "🟠 20-30% (2.5 pt)" : "🔴 > 30% (0 pt)"}`);

  if (result.reasoning) {
    console.log(`\n💬 AI observation: ${result.reasoning}`);
  }
}

main().catch((e) => {
  console.error("❌ Failed:", e.message);
  console.error(e.stack);
  process.exit(1);
});
