// AI Drafter — uses Claude Opus 4.7 to:
//   1. Read user's natural-language intent
//   2. Cross-reference with strategic plan items (NS/MP/AP from Menu 1)
//   3. Generate official Thai government letter (หนังสือสั่งการ)
//   4. Return alignment to all 3 plan levels + suggested KPIs

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import type {
  DrafterInput,
  DrafterOutput,
  KpiDefinition,
} from "./types";
import {
  listDocuments,
  getItemsForDocument,
} from "@/lib/strategic/store";

// ── Build candidate plans from Strategic store ─

export function gatherCandidatePlans(): DrafterInput["candidatePlans"] {
  const allDocs = listDocuments();
  const ns = allDocs.find((d) => d.level === 1);
  const mps = allDocs.filter((d) => d.level === 2);
  const aps = allDocs.filter((d) => d.level === 3);

  // National strategy → top-level items (the 6 pillars)
  const nsItems = ns
    ? getItemsForDocument(ns.id).filter((i) => i.parentItemId === null)
    : [];

  // Master plans → 1 representative item per MP (the doc title is enough)
  // Use top-level items of each MP for richer matching
  const mpItems: { id: string; number: string; name: string; description?: string }[] = [];
  for (const mp of mps) {
    const items = getItemsForDocument(mp.id).filter((i) => i.parentItemId === null);
    if (items.length === 0) {
      // No items — use doc itself as a synthetic item
      const number = mp.title.match(/\((\d+)\)/)?.[1] ?? "";
      mpItems.push({
        id: `${mp.id}-doc`,
        number: `MP-${number}`,
        name: mp.title.split("ประเด็น").pop()?.trim() ?? mp.title,
        description: mp.description,
      });
    } else {
      for (const it of items) {
        mpItems.push({
          id: it.id,
          number: it.number,
          name: it.name,
          description: it.description,
        });
      }
    }
  }

  // Action plans → just the docs themselves
  const apItems = aps.map((ap) => ({
    id: `${ap.id}-doc`,
    number: ap.id,
    name: ap.title,
    description: ap.description,
  }));

  return {
    nationalStrategy: nsItems.map((i) => ({
      id: i.id,
      number: i.number,
      name: i.name,
      description: i.description,
    })),
    masterPlans: mpItems,
    actionPlans: apItems,
  };
}

// ── Prompt construction ────────────────────────

function buildSystemPrompt(): string {
  return `คุณเป็นผู้เชี่ยวชาญด้านการร่างหนังสือสั่งการของสำนักงานตำรวจแห่งชาติ (Royal Thai Police) ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และที่แก้ไขเพิ่มเติม

ภารกิจของคุณ:
รับ "คำสำคัญ + ข้อมูลตั้งต้น + บริบทที่เกี่ยวข้อง" จากผู้บังคับบัญชา → ร่างหนังสือสั่งการที่มีองค์ประกอบครบตามระเบียบราชการ + จับคู่กับแผนยุทธศาสตร์ ๓ ระดับ + แนะนำ KPI

────────────────────────────────────────────────
องค์ประกอบที่ต้องมีในเอกสาร (ตามระเบียบงานสารบรรณ)
────────────────────────────────────────────────

๑. หัวเรื่อง (subject) — ใช้คำว่า "เรื่อง ..." ขึ้นต้น สั้น กระชับ ระบุประเด็นหลัก
๒. ผู้รับ (recipient) — ใช้คำว่า "เรียน ..." ระบุตำแหน่งหรือหน่วยงานปลายทาง (เช่น "เรียน ผู้บังคับการตำรวจภูธรจังหวัด ในสังกัด ภ.๕ ทุกจังหวัด")
๓. วัตถุประสงค์/เหตุผลของการสั่งการ (objective) — ๑-๒ ประโยค บอกเหตุผล/ที่มา/ความจำเป็น (เช่น "เพื่อแก้ไขปัญหา...", "ตามที่มีสถานการณ์...")
๔. ข้อสั่งการหลัก/แนวทางปฏิบัติ (directives) — เรียงเป็นข้อ ๑./๒./๓. (ใช้เลขไทย) ระบุการกระทำที่ต้องทำให้ชัด เป็นการกระทำที่วัดผลได้
๕. ระยะเวลา/เงื่อนไขการรายงานผล (reportInstruction) — ระบุระยะเวลาดำเนินการและความถี่ในการรายงาน (เช่น "ให้รายงานผลทุกสัปดาห์ทางระบบ EOP ภายในวันศุกร์ของทุกสัปดาห์ ระยะเวลาดำเนินการ ๓๐ วัน")

────────────────────────────────────────────────
รูปแบบภาษาราชการที่ต้องใช้
────────────────────────────────────────────────

- คำขึ้นต้นความนำ: "ด้วย ...", "ตามที่ ...", "โดยที่ ...", "เพื่อให้ ..."
- คำสั่งการ: "อาศัยอำนาจตาม...", "จึงสั่งการให้...", "จึงให้ดำเนินการดังนี้"
- คำลงท้าย: "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป", "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด"
- เลขข้อ: ใช้เลขไทย ๑./๒./๓. (ห้ามใช้ 1./2./3.)
- ใช้คำสุภาพ ทางการ ไม่ใช้คำพูด/สแลง

────────────────────────────────────────────────
การจับคู่แผน ๓ ระดับ
────────────────────────────────────────────────

- ระดับ ๓ (แผนปฏิบัติฯ ตร.) จับคู่ก่อน — ตรงงานปฏิบัติของ ตร. มากที่สุด
- ระดับ ๒ จับคู่ที่สอดคล้องกับระดับ ๓ ที่เลือก
- ระดับ ๑ จับคู่ที่ครอบคลุมระดับ ๒
- ถ้าไม่มีตัวที่ใกล้เคียง คืน array ว่าง — ห้ามฝืนจับคู่

────────────────────────────────────────────────
ตัวอย่างหนังสือจริงเป็นข้อมูล training context
────────────────────────────────────────────────

ตัวอย่างที่ ๑ (เรื่องการตั้งจุดตรวจช่วงเทศกาล):
- เรื่อง: การระดมกวาดล้างและตั้งจุดตรวจกวดขันวินัยจราจรในช่วงเทศกาลปีใหม่
- เรียน: ผู้บังคับการตำรวจนครบาล ๑–๙ และ ผู้บังคับการตำรวจภูธรจังหวัดทุกแห่ง
- วัตถุประสงค์: เพื่อลดอุบัติเหตุและการสูญเสียในช่วงเทศกาลปีใหม่ ตามนโยบาย ผบ.ตร.
- ข้อสั่งการ: ๑. ให้ตั้งจุดตรวจตลอด ๒๔ ชั่วโมง บนถนนสายหลัก ๒. เน้นตรวจผู้ขับขี่ที่เมาสุราและไม่สวมหมวกนิรภัย ๓. รายงานสถิติประจำวัน
- ระยะเวลา/รายงาน: ระยะเวลา ๗ วัน (๒๘ ธ.ค. – ๓ ม.ค.) รายงานผลทุกวันเวลา ๒๐.๐๐ น. ผ่านระบบ EOP

ตัวอย่างที่ ๒ (เรื่องคอลเซ็นเตอร์):
- เรื่อง: การปราบปรามแก๊งคอลเซ็นเตอร์ในพื้นที่ตำรวจภูธรภาค ๕
- เรียน: ผู้บังคับการตำรวจภูธรจังหวัด ในสังกัด ภ.๕ ทุกจังหวัด
- วัตถุประสงค์: ด้วยสถานการณ์การหลอกลวงทางโทรศัพท์โดยแก๊งคอลเซ็นเตอร์มีแนวโน้มเพิ่มขึ้นต่อเนื่อง ส่งผลกระทบต่อประชาชนเป็นวงกว้าง
- ข้อสั่งการ: ๑. ให้ บก.สส. เร่งรัดสืบสวนเครือข่ายแก๊งคอลเซ็นเตอร์ ๒. ประสานหน่วยงานที่เกี่ยวข้องดำเนินการจับกุมโดยเร่งด่วน ๓. รายงานความคืบหน้าทุกสัปดาห์
- ระยะเวลา/รายงาน: ระยะเวลา ๓๐ วัน รายงานผลการจับกุมทุกสัปดาห์ (ภายในวันศุกร์)`;
}

function buildUserPrompt(input: DrafterInput): string {
  const ns = input.candidatePlans.nationalStrategy
    .map((i) => `  [${i.id}] ${i.number} ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");
  const mp = input.candidatePlans.masterPlans
    .map((i) => `  [${i.id}] ${i.number} ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");
  const ap = input.candidatePlans.actionPlans
    .map((i) => `  [${i.id}] ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");

  // Build candidate units block — only show levels 1-3 to avoid prompt bloat
  const units = (input.candidateUnits ?? []).filter((u) => u.level <= 3);
  const unitsBlock = units.length === 0
    ? "(ไม่มีข้อมูล)"
    : units
        .map((u) => `  [${u.id}] ${u.shortName ?? u.code} — ${u.name} (level ${u.level})`)
        .join("\n");

  // Build the user-input block — prefer PoC-style 3-field structure if provided
  let inputBlock: string;
  if (input.fields && (input.fields.keywords || input.fields.baseInfo || input.fields.context)) {
    inputBlock = `## INPUT ของผู้สั่งการ (PoC 3-field format)

### ๑. คำสำคัญ (Keywords)
${input.fields.keywords || "(ไม่ระบุ)"}

### ๒. ข้อมูลตั้งต้น (Base Info)
${input.fields.baseInfo || "(ไม่ระบุ)"}

### ๓. บริบทที่เกี่ยวข้อง (Context)
${input.fields.context || "(ไม่ระบุ)"}`;
  } else {
    inputBlock = `## เจตนาของผู้สั่งการ
"${input.intent}"`;
  }

  return `${inputBlock}

## ผู้ลงนาม (signer)
- ชื่อ-นามสกุล: ${input.signerName}
- ตำแหน่ง: ${input.signerTitle}
- หน่วย: ${input.signerUnit}

## แผนระดับ ๑ ยุทธศาสตร์ชาติ (ใส่ id ใน alignment เป็น [...] ที่อยู่หน้าชื่อ)
${ns || "(ไม่มีข้อมูล)"}

## แผนระดับ ๒ แผนแม่บท
${mp || "(ไม่มีข้อมูล)"}

## แผนระดับ ๓ แผนปฏิบัติราชการ ตร.
${ap || "(ไม่มีข้อมูล)"}

## หน่วยงานที่ส่งคำสั่งได้ (candidate target units)
${unitsBlock}

---

หน้าที่: สังเคราะห์ INPUT ข้างต้น → ร่างหนังสือสั่งการที่มีองค์ประกอบครบ ๕ ข้อ ตามเกณฑ์ PoC + แนะนำหน่วยรับ+ระยะเวลาที่เหมาะสม

ตอบกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่นนอก JSON) ตาม schema:

{
  "alignment": {
    "actionPlanItemIds": ["<id ของระดับ ๓>"],
    "masterPlanItemIds": ["<id ของระดับ ๒>"],
    "nationalStrategyItemIds": ["<id ของระดับ ๑>"],
    "explanation": "เหตุผลที่จับคู่กับแผนเหล่านี้ (๒-๓ ประโยค)"
  },
  "letter": {
    "subject": "ขึ้นต้นด้วย 'เรื่อง ...' (PoC #1 - หัวเรื่อง)",
    "recipient": "ขึ้นต้นด้วย 'เรียน ...' (PoC #2 - หน่วยงาน/ผู้รับ)",
    "objective": "วัตถุประสงค์/เหตุผลของการสั่งการ (PoC #3 - 1-2 ประโยค)",
    "references": ["อ้างถึง ๑. ...", "อ้างถึง ๒. ..."],
    "attachments": [],
    "introduction": "ความนำของหนังสือเต็มรูปแบบ (รวมวัตถุประสงค์+อ้างถึงแผน+บริบท) — ภาษาราชการ",
    "directives": [
      "๑. ให้ดำเนินการ ... (PoC #4 - ข้อสั่งการหลัก)",
      "๒. ให้รายงานผล ...",
      "๓. ..."
    ],
    "reportInstruction": "ระยะเวลา ... และให้รายงานผลทุก ... (PoC #5 - ระยะเวลา/รายงาน)",
    "closing": "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด"
  },
  "suggestedKpis": [
    {
      "id": "k1",
      "type": "QUANTITATIVE",
      "metric": "จำนวนจุดตรวจ",
      "unit": "จุด",
      "targetTotal": 100,
      "reportFrequency": "DAILY",
      "description": "..."
    },
    {
      "id": "k2",
      "type": "QUALITATIVE",
      "metric": "รายงานสรุปผลการปฏิบัติ",
      "reportFrequency": "END_OF_PERIOD",
      "description": "..."
    }
  ],
  "suggestedTargetUnitIds": ["<u-... จาก candidate units ที่ตรงกับ recipient>"],
  "suggestedCascadeMode": "CASCADE | DIRECT",
  "suggestedDurationDays": 30
}

หลักการเลือก suggestedTargetUnitIds:
- จับคู่ recipient ที่ร่างไว้กับ candidate units ที่มี
- ตัวอย่าง:
  * recipient "ผู้บังคับการตำรวจภูธรจังหวัด ในสังกัด ภ.๕ ทุกจังหวัด" → ใส่ u-bch-5 + เลือก cascadeMode "CASCADE" (จะกระจายลงไปยังจังหวัดในสังกัดอัตโนมัติ)
  * recipient "ผู้บัญชาการตำรวจนครบาล" → ใส่ u-bch-na + cascadeMode "DIRECT"
  * recipient "ทุก สภ./สน. ทั่วประเทศ" → ใส่ u-rtp + cascadeMode "CASCADE"
- ถ้า recipient ระบุหลายหน่วยพร้อมกัน ให้ใส่ทุก unit IDs ที่ตรง
- ถ้าไม่แน่ใจ ใส่หน่วยที่ครอบคลุมที่สุด + cascadeMode "CASCADE"

หลักการเลือก suggestedDurationDays:
- อ่านจาก reportInstruction ที่ร่างไว้
- ระยะเวลา ๗ วัน → 7, ระยะเวลา ๓๐ วัน → 30, ระยะเวลา ๓ เดือน → 90 ฯลฯ
- ถ้าไม่ระบุชัด ให้ใส่ค่า default 30

CHECKLIST ก่อนคืนผลลัพธ์ — ทุกข้อต้องครบ:
✓ letter.subject ขึ้นต้น "เรื่อง"
✓ letter.recipient ขึ้นต้น "เรียน"
✓ letter.objective มีและไม่ซ้ำกับ introduction
✓ letter.directives มีอย่างน้อย ๒ ข้อ ใช้เลขไทย ๑./๒.
✓ letter.reportInstruction ระบุทั้ง "ระยะเวลา" และ "การรายงาน"
✓ letter.closing ลงท้ายภาษาราชการ
✓ suggestedTargetUnitIds มีอย่างน้อย ๑ id ที่อยู่ใน candidate units
✓ suggestedDurationDays สอดคล้องกับ reportInstruction`;
}

// ── Main entry ─────────────────────────────────

export interface DraftOutcomeOk {
  ok: true;
  result: DrafterOutput;
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface DraftOutcomeFail {
  ok: false;
  error: string;
  durationMs: number;
}

export type DraftOutcome = DraftOutcomeOk | DraftOutcomeFail;

const FALLBACK: DrafterOutput = {
  letter: {
    subject: "(ร่างไม่สำเร็จ)",
    recipient: "",
    introduction: "",
    directives: [],
    closing: "",
  },
  alignment: {
    nationalStrategyItemIds: [],
    masterPlanItemIds: [],
    actionPlanItemIds: [],
    explanation: "",
  },
  suggestedKpis: [],
};

export async function draftCommand(input: DrafterInput): Promise<DraftOutcome> {
  const start = Date.now();
  let client;
  try {
    client = getClaude();
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message,
      durationMs: Date.now() - start,
    };
  }

  try {
    const response = await client.messages.create({
      model: MODELS.OPUS,
      max_tokens: 8000,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        ok: false,
        error: "AI Engine ไม่ได้คืน text content",
        durationMs: Date.now() - start,
      };
    }

    const parsed = parseClaudeJson<DrafterOutput>(textBlock.text, FALLBACK);
    if (!parsed.letter?.subject) {
      return {
        ok: false,
        error: "AI ไม่ได้คืนหนังสือที่ใช้ได้ — ลองอีกครั้ง",
        durationMs: Date.now() - start,
      };
    }

    // Ensure KPI IDs exist
    parsed.suggestedKpis = (parsed.suggestedKpis ?? []).map((k, idx) => ({
      ...k,
      id: k.id ?? `kpi-${Date.now()}-${idx}`,
    })) as KpiDefinition[];

    // Validate suggested target unit IDs — only keep ones that exist in candidates
    if (parsed.suggestedTargetUnitIds && input.candidateUnits) {
      const validIds = new Set(input.candidateUnits.map((u) => u.id));
      parsed.suggestedTargetUnitIds = parsed.suggestedTargetUnitIds.filter((id) =>
        validIds.has(id)
      );
    }

    // Clamp duration to sane range
    if (parsed.suggestedDurationDays !== undefined) {
      parsed.suggestedDurationDays = Math.min(
        365,
        Math.max(1, Math.round(parsed.suggestedDurationDays))
      );
    }

    return {
      ok: true,
      result: parsed,
      model: MODELS.OPUS,
      durationMs: Date.now() - start,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message || "เกิดข้อผิดพลาดในการร่าง",
      durationMs: Date.now() - start,
    };
  }
}
