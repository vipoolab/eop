// Quick sanity test for Claude API
// Run: npx tsx scripts/test-claude.ts

import { config } from "dotenv";
config({ override: true }); // Override Claude Code's internal key
import { generateCommandDraft } from "../features/ai/command-draft";

async function main() {
  console.log("🧪 Testing Claude API...\n");

  const t0 = Date.now();
  const result = await generateCommandDraft({
    subject: "การจัดทำรายงาน ก.พ.ร. ประจำไตรมาส",
    objective:
      "รวบรวมและจัดทำรายงานผลการปฏิบัติราชการตามตัวชี้วัด ก.พ.ร.",
    recipient: "หน.หน่วยในสังกัด สยศ.ตร. ทุกหน่วย",
    timeframe: "ส่งภายในวันที่ ๓๐ พ.ค. ๖๙",
    priority: "NORMAL",
  });
  const elapsed = Date.now() - t0;

  console.log("✅ Success!");
  console.log("   Model:", result.model);
  console.log("   Tokens:", result.tokensUsed);
  console.log("   Time:", elapsed, "ms\n");
  console.log("📝 Reference:", result.reference);
  console.log("🎯 Objective:", result.objective);
  console.log("\n📄 Body:");
  console.log(result.body);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
