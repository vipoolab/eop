// AI Plan Extractor — TOR ๑.๑.๒
// Claude วิเคราะห์ text จากเอกสาร → คืนโครงสร้าง StrategicPlan + KPI

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";

export interface ExtractedKpi {
  code: string;
  name: string;
  target: number | null;
  unit: string | null;
}

export interface ExtractedPlan {
  level: "NATIONAL" | "MASTER" | "ACTION";
  code: string;
  title: string;
  description: string | null;
  policyIntent: string | null;
  kpis: ExtractedKpi[];
}

export interface ExtractionResult {
  plans: ExtractedPlan[];
  model: string;
  tokensUsed: number;
  elapsedMs: number;
  rawResponse: string;
}

const SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้านการอ่านเอกสารแผนยุทธศาสตร์ภาครัฐของประเทศไทย

# หน้าที่
อ่านเอกสารแผน (PDF/DOCX/TXT ที่ extract เป็น text แล้ว) แล้วแยกโครงสร้างเป็น JSON

# ระดับแผน
- NATIONAL = ยุทธศาสตร์ชาติ 20 ปี (สศช.)
- MASTER = แผนแม่บท (สำนักนายกฯ)
- ACTION = แผนปฏิบัติราชการ (ตร. / หน่วย)

# วิธีแยก
- แต่ละแผนในเอกสาร: ระบุ level, code (ถ้ามี), title, description (1-3 ประโยคย่อ), policyIntent (เจตนาเชิงนโยบายโดยสรุป), kpis
- ถ้าเอกสารกล่าวถึงตัวชี้วัด (KPI) เป้าหมาย หน่วยวัด — ใส่ใน kpis array
- ถ้าไม่ระบุ code → สร้าง code ที่สื่อความหมาย เช่น "MASTER-SAFETY-2569"
- ถ้าไม่ระบุ target → ใส่ null
- ถ้าเอกสารมีแผนหลายแผน → แยกเป็นหลาย object ใน plans array

# Output Format (JSON เท่านั้น ห้ามมีข้อความอื่น)
{
  "plans": [
    {
      "level": "NATIONAL|MASTER|ACTION",
      "code": "string",
      "title": "ชื่อแผน",
      "description": "คำอธิบายโดยย่อ",
      "policyIntent": "เจตนาเชิงนโยบายโดยสรุป",
      "kpis": [
        { "code": "KPI-XX", "name": "ชื่อตัวชี้วัด", "target": 30, "unit": "%" }
      ]
    }
  ]
}`;

export async function extractPlansFromText(
  text: string
): Promise<ExtractionResult> {
  const t0 = Date.now();

  const response = await getClaude().messages.create({
    model: MODELS.OPUS,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          "# เอกสารแผนที่ต้องวิเคราะห์",
          "",
          text,
          "",
          "กรุณาแยกโครงสร้างแผนและ KPI ที่อยู่ในเอกสารนี้ คืนผลเป็น JSON เท่านั้น",
        ].join("\n"),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude ไม่ตอบกลับเป็นข้อความ");
  }

  const parsed = parseClaudeJson<{ plans?: ExtractedPlan[] }>(textBlock.text, {
    plans: [],
  });

  return {
    plans: parsed.plans ?? [],
    model: MODELS.OPUS,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    elapsedMs: Date.now() - t0,
    rawResponse: textBlock.text,
  };
}
