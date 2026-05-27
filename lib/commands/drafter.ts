// AI Drafter (chunked) — Claude generates a คำสั่ง in 3 separate steps,
// each its own API route so every call stays under Vercel's 60s cap:
//   Step 1  draftLetter           — letter core from the 3-field input
//   Step 2  matchAlignment        — match the letter to 3-level plans
//   Step 3  suggestKpisAndTargets — KPIs + target units + duration
// Shared: buildSystemPrompt() (the คำสั่ง rules + training examples) and
// gatherCandidatePlans() (NS/MP/AP from Menu 1).

import { getClaude, MODELS, parseClaudeJson } from "@/lib/claude";
import type {
  DrafterInput,
  KpiDefinition,
  CommandAlignment,
  CommandLetter,
  DraftInputFields,
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
  return `คุณเป็นผู้เชี่ยวชาญด้านการร่าง "คำสั่ง" ของสำนักงานตำรวจแห่งชาติ (Royal Thai Police) ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ข้อ ๒๒ — "คำสั่ง" เป็นหนังสือสั่งการประเภทหนึ่ง ใช้บรรดาข้อความที่ผู้บังคับบัญชาสั่งการให้ปฏิบัติ

ภารกิจของคุณ:
รับ "คำสำคัญ + ข้อมูลตั้งต้น + บริบทที่เกี่ยวข้อง" จากผู้บังคับบัญชา → ร่าง "คำสั่ง" ที่มีโครงสร้างครบตามระเบียบ + จับคู่กับแผนยุทธศาสตร์ ๓ ระดับ + แนะนำ KPI

────────────────────────────────────────────────
โครงสร้าง "คำสั่ง" ตามระเบียบสารบรรณ ข้อ ๒๒
────────────────────────────────────────────────

[หัวกระดาษ - ตราครุฑ ตรงกลาง]

          คำสั่งสำนักงานตำรวจแห่งชาติ
              ที่ ๑๒๓/๒๕๖๙
       เรื่อง <subject>
       ──────────────────────

       <objective — ความนำ ที่มา/เหตุผล/บริบท>
       <legalBasis — อาศัยอำนาจตาม...>
       จึงสั่งให้ดำเนินการดังต่อไปนี้

       ๑. <directives[0]>
       ๒. <directives[1]>
       ๓. ...
       (ข้อสุดท้ายมัก = ระยะเวลา + วิธีรายงาน)

       <effectiveClause — ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป...>

                     สั่ง ณ วันที่ ... พ.ศ. ๒๕๖๙

                                  (ลายเซ็น)
                          (ชื่อ-สกุลผู้สั่งการ)
                              ตำแหน่งผู้สั่งการ

────────────────────────────────────────────────
หลักการสำคัญของ "คำสั่ง" (ห้ามผสมกับหนังสือภายนอก)
────────────────────────────────────────────────

✓ ห้ามมี "เรียน" — คำสั่งเป็น unilateral order ไม่ใช่จดหมายถึงคน
✓ ห้ามใช้ "จึงเรียนมาเพื่อทราบและถือปฏิบัติ" — คำสั่งใช้ "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป" แทน
✓ ห้ามมี "ขอแสดงความนับถือ" — คำสั่งไม่มี
✓ ต้องมี "อาศัยอำนาจตาม..." ก่อนข้อสั่งการเสมอ
✓ ต้องลงท้ายด้วย "สั่ง ณ วันที่ ..." ตำแหน่งกลาง-ขวา ก่อน signature

────────────────────────────────────────────────
รูปแบบภาษา
────────────────────────────────────────────────

- คำขึ้นต้นความนำ (objective): "ด้วย ...", "ตามที่ ...", "โดยที่ ...", "เพื่อให้ ..."
- คำให้อำนาจ (legalBasis): "อาศัยอำนาจตามความในมาตรา ... แห่งพระราชบัญญัติ..." หรือ "อาศัยอำนาจตามข้อ ... แห่งระเบียบ..." แล้วตามด้วยตำแหน่งผู้สั่ง "ผู้บัญชาการตำรวจแห่งชาติ จึงสั่งให้ดำเนินการดังต่อไปนี้"
- ข้อสั่งการ: ขึ้นต้น "ให้..." เสมอ ใช้เลขไทย ๑./๒./๓.
- คำลงท้าย (effectiveClause): "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป" + อาจระบุช่วงเวลาเพิ่ม เช่น "จนถึงวันที่ ๒๕ มิถุนายน พ.ศ. ๒๕๖๙" หรือ "หรือจนกว่าจะมีคำสั่งเปลี่ยนแปลง"
- ใช้คำสุภาพ ทางการ เลขไทยทั้งหมด

────────────────────────────────────────────────
กฎหมายอ้างอิง — เลือกที่เหมาะสมกับเรื่อง
────────────────────────────────────────────────

- งานปฏิบัติทั่วไป: "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๑๑" (อำนาจ ผบ.ตร.)
- งานป้องกัน/ปราบปราม: "ประมวลกฎหมายวิธีพิจารณาความอาญา + พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕"
- งานยาเสพติด: "พระราชบัญญัติให้ใช้ประมวลกฎหมายยาเสพติด พ.ศ. ๒๕๖๔"
- งานจราจร: "พระราชบัญญัติจราจรทางบก พ.ศ. ๒๕๒๒"
- งานบริหารบุคคล: "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ + กฎ ก.ตร."
- ถ้าไม่แน่ใจ: "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕"

────────────────────────────────────────────────
การจับคู่แผน ๓ ระดับ
────────────────────────────────────────────────

- ระดับ ๓ (แผนปฏิบัติฯ ตร.) จับคู่ก่อน — ตรงงานปฏิบัติของ ตร. มากที่สุด
- ระดับ ๒ จับคู่ที่สอดคล้องกับระดับ ๓ ที่เลือก
- ระดับ ๑ จับคู่ที่ครอบคลุมระดับ ๒
- ถ้าไม่มีตัวที่ใกล้เคียง คืน array ว่าง — ห้ามฝืนจับคู่

────────────────────────────────────────────────
ตัวอย่างคำสั่งจริง (training)
────────────────────────────────────────────────

ตัวอย่างที่ ๑ — คำสั่งตั้งจุดตรวจช่วงเทศกาลปีใหม่:
- subject: "การระดมกวาดล้างและตั้งจุดตรวจกวดขันวินัยจราจรในช่วงเทศกาลปีใหม่ ๒๕๖๙"
- objective: "ด้วยเทศกาลปีใหม่เป็นช่วงเวลาที่ประชาชนเดินทางสัญจรเป็นจำนวนมาก สถิติย้อนหลังปรากฏอุบัติเหตุและการเสียชีวิตในระดับสูง ส่วนใหญ่มีสาเหตุจากการขับขี่ในขณะมึนเมาและไม่สวมหมวกนิรภัย เพื่อให้การป้องกันและลดอุบัติเหตุในช่วงเทศกาลเป็นไปอย่างมีประสิทธิภาพ และสอดคล้องกับนโยบายรัฐบาลเรื่อง ๗ วันอันตราย"
- legalBasis: "อาศัยอำนาจตามความในมาตรา ๑๑ แห่งพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ ประกอบกับพระราชบัญญัติจราจรทางบก พ.ศ. ๒๕๒๒ ผู้บัญชาการตำรวจแห่งชาติ จึงสั่งให้ดำเนินการดังต่อไปนี้"
- directives: [
    "๑. ให้กองบัญชาการตำรวจนครบาล กองบัญชาการตำรวจภูธรภาค ๑–๙ และกองบัญชาการตำรวจตระเวนชายแดน ตั้งจุดตรวจวินัยจราจรตลอด ๒๔ ชั่วโมง บนถนนสายหลักและถนนสายรองในพื้นที่รับผิดชอบ รวมไม่น้อยกว่า ๑,๐๐๐ จุดทั่วประเทศ",
    "๒. ให้ทุกหน่วยเน้นการตรวจวัดระดับแอลกอฮอล์ผู้ขับขี่ การตรวจความพร้อมของผู้ขับขี่ การสวมหมวกนิรภัย และอุปกรณ์ความปลอดภัยของยานพาหนะ",
    "๓. ให้ดำเนินคดีอย่างเด็ดขาดต่อผู้กระทำผิดที่อาจเป็นเหตุให้เกิดอันตรายร้ายแรง โดยเฉพาะผู้ขับขี่ขณะมึนเมา",
    "๔. ให้รายงานสถิติการตั้งจุดตรวจและผลการดำเนินคดีประจำวัน เข้าสู่ระบบ EOP ภายในเวลา ๒๐.๐๐ น. ของทุกวัน"
  ]
- effectiveClause: "ทั้งนี้ ตั้งแต่วันที่ ๒๘ ธันวาคม พ.ศ. ๒๕๖๘ ถึงวันที่ ๓ มกราคม พ.ศ. ๒๕๖๙"

ตัวอย่างที่ ๒ — คำสั่งปราบปรามแก๊งคอลเซ็นเตอร์ ภ.๕:
- subject: "การปราบปรามแก๊งคอลเซ็นเตอร์ในพื้นที่ตำรวจภูธรภาค ๕"
- objective: "ด้วยสถานการณ์การหลอกลวงทางโทรศัพท์โดยแก๊งคอลเซ็นเตอร์ในพื้นที่ภาคเหนือมีแนวโน้มเพิ่มขึ้นต่อเนื่อง โดยเฉพาะการหลอกลงทุนคริปโตและการแอบอ้างเป็นเจ้าหน้าที่รัฐ ส่งผลกระทบต่อประชาชนเป็นวงกว้าง สอดคล้องกับนโยบาย ผบ.ตร. ข้อที่ ๓ ปราบปรามอาชญากรรมรุนแรง"
- legalBasis: "อาศัยอำนาจตามความในมาตรา ๑๑ แห่งพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ ประกอบกับประมวลกฎหมายวิธีพิจารณาความอาญา ผู้บัญชาการตำรวจแห่งชาติ จึงสั่งให้ดำเนินการดังต่อไปนี้"
- directives: [
    "๑. ให้กองบังคับการสืบสวนสอบสวน ตำรวจภูธรภาค ๕ เร่งรัดสืบสวนเครือข่ายแก๊งคอลเซ็นเตอร์ในพื้นที่ภ.จว.เชียงใหม่ เชียงราย ลำปาง และลำพูน",
    "๒. ให้ประสานกองบังคับการปราบปรามการกระทำความผิดเกี่ยวกับอาชญากรรมทางเทคโนโลยี และกรมสอบสวนคดีพิเศษ ดำเนินการจับกุมโดยเร่งด่วน เป้าหมายไม่น้อยกว่า ๒๐๐ ราย",
    "๓. ให้ยึดทรัพย์ผู้กระทำผิดและผู้เกี่ยวข้องตามพระราชบัญญัติมาตรการพิเศษในการดำเนินคดีกับผู้กระทำผิดเกี่ยวกับยาเสพติด",
    "๔. ให้รายงานความคืบหน้าการสืบสวนและผลการจับกุมทุกสัปดาห์ ภายในวันศุกร์ ผ่านระบบ EOP"
  ]
- effectiveClause: "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป จนถึงวันที่ ๒๕ มิถุนายน พ.ศ. ๒๕๖๙"`;
}


// ═══════════════════════════════════════════════════════════════
// CHUNKED DRAFTING — 3 separate steps, each < 60s (Vercel Hobby cap)
//   Step 1: draftLetter            — letter core, no plans/units (light input)
//   Step 2: matchAlignment         — match letter to 3-level plans
//   Step 3: suggestKpisAndTargets  — KPIs + target units + duration
// The client orchestrates them sequentially; each is its own API route.
// ═══════════════════════════════════════════════════════════════

type StepMeta = { model: string; durationMs: number; inputTokens: number; outputTokens: number };

// ── STEP 1: draftLetter ────────────────────────
// Only needs user input + signer. NO candidate plans/units → input shrinks
// from ~25k to ~3k tokens, so this (the heaviest-output step) stays well
// under 60s.

export interface DraftLetterInput {
  fields?: DraftInputFields;
  intent: string;
  signerName: string;
  signerTitle: string;
  signerUnit: string;
}

export type LetterCore = Pick<
  CommandLetter,
  | "subject"
  | "recipient"
  | "objective"
  | "legalBasis"
  | "directives"
  | "effectiveClause"
  | "subjectSuffix"
  | "isAmendment"
>;

export type StepOutcome<T> =
  | ({ ok: true; result: T } & StepMeta)
  | { ok: false; error: string; durationMs: number };

function buildLetterUserPrompt(input: DraftLetterInput): string {
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
    inputBlock = `## เจตนาของผู้สั่งการ\n"${input.intent}"`;
  }

  return `${inputBlock}

## ผู้ลงนาม (signer)
- ชื่อ-นามสกุล: ${input.signerName}
- ตำแหน่ง: ${input.signerTitle}
- หน่วย: ${input.signerUnit}

---

หน้าที่: ร่าง "คำสั่ง" จาก INPUT ข้างต้น ตามระเบียบสารบรรณ ข้อ ๑๖ (ยังไม่ต้องจับคู่แผนหรือ KPI — ทำเฉพาะตัวหนังสือ)

⭐ หลักการสำคัญเรื่องความครบถ้วน (อ่านก่อนร่าง):
- เขียนให้ "**ใจความครบถ้วน อ่านแล้วเข้าใจได้ทันที**" — ผู้รับคำสั่งต้องรู้ว่าต้องทำอะไร ใคร ที่ไหน เมื่อไหร่ เป้าหมายเท่าไร โดยไม่ต้องเดา
- ดึงข้อมูลทุกอย่างจาก INPUT (ตัวเลข พื้นที่ หน่วยร่วม ระยะเวลา เป้าหมาย) มาใส่ในเนื้อหาให้ครบ อย่าตกหล่น
- **directives**: ๔–๘ ข้อ แต่ละข้อระบุครบ "ให้หน่วยใด ทำอะไร เป้าหมาย/ตัวเลขเท่าไร" — **กระชับพอดี ~๒-๔ บรรทัดต่อข้อ** ไม่ฟุ่มเฟือย ไม่ซ้ำความ
- **objective**: ๑–๒ ย่อหน้า ให้บริบท+เหตุผล+ความจำเป็นครบ แต่ไม่ยืดยาว
- ใช้ภาษาราชการที่ทางการแต่ "อ่านลื่น เข้าใจง่าย" ไม่กำกวม
- เน้น "ครบใจความ" มากกว่า "ยาว" — กระชับแต่ไม่ตกประเด็น (ผลรวมทั้งฉบับไม่ควรเกิน ~๒,๕๐๐ คำ)

ตอบกลับเป็น JSON เท่านั้น ตาม schema:

{
  "subject": "ชื่อเรื่อง — กระชับแต่ครบประเด็น ไม่ขึ้นต้น 'เรื่อง'",
  "recipient": "หน่วยรับคำสั่ง (เพื่อ targeting — ไม่ปรากฏในเอกสาร)",
  "objective": "ความนำ ๑–๓ ย่อหน้าสมบูรณ์ ขึ้นต้น 'ด้วย/ตามที่/โดยที่' ระบุสถานการณ์+เหตุผล+ความจำเป็นครบถ้วน ถ้า input อ้างคำสั่งเดิมให้เขียน 'ตามคำสั่ง... นั้น'",
  "legalBasis": "อาศัยอำนาจตามความในมาตรา ... แห่งพระราชบัญญัติ... <ตำแหน่งผู้สั่ง> จึงสั่งให้ดำเนินการดังต่อไปนี้ (เลือกกฎหมายให้ตรงเนื้อหา)",
  "directives": ["๑. ให้<หน่วย> <ทำอะไร อย่างไร ที่ไหน เป้าหมายเท่าไร>...", "๒. ให้...", "๓. ให้...", "... (มีกี่ข้อก็ได้ ๔–๑๐ ข้อ) ...", "ข้อสุดท้าย ให้รายงานผล..."],
  "effectiveClause": "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป... (ระบุช่วงเวลาถ้ามี)",
  "subjectSuffix": "'(เพิ่มเติม)' เฉพาะกรณีแก้ไขคำสั่งเดิม มิฉะนั้นเว้นว่าง",
  "isAmendment": false
}

หลักการเลือก legalBasis:
- ยาเสพติด → "...มาตรา ๑๑ แห่ง พ.ร.บ.ตำรวจฯ ๒๕๖๕ ประกอบประมวลกฎหมายยาเสพติด พ.ศ. ๒๕๖๔"
- จราจร → "...ประกอบ พ.ร.บ.จราจรทางบก พ.ศ. ๒๕๒๒"
- สืบสวน/จับกุม → "...ประกอบประมวลกฎหมายวิธีพิจารณาความอาญา"
- บริหารบุคคล/มอบอำนาจ → "มาตรา ๒๓ (๔) มาตรา ๒๔ และมาตรา ๒๐๔ แห่ง พ.ร.บ.ตำรวจฯ ๒๕๖๕"
- ทั่วไป → "มาตรา ๑๑ แห่ง พ.ร.บ.ตำรวจฯ ๒๕๖๕"

CHECKLIST: ใจความครบถ้วน อ่านเข้าใจง่าย · directives ละเอียดทุกข้อ (ใคร/ทำอะไร/เป้าหมาย) · ไม่มี "เรียน"/"ขอแสดงความนับถือ" · directives ขึ้นต้น "ให้" เลขไทย · effectiveClause ขึ้นต้น "ทั้งนี้ ตั้งแต่"`;
}

const LETTER_FALLBACK: LetterCore = {
  subject: "(ร่างไม่สำเร็จ)",
  recipient: "",
  objective: "",
  legalBasis: "",
  directives: [],
  effectiveClause: "",
};

export async function draftLetter(input: DraftLetterInput): Promise<StepOutcome<LetterCore>> {
  const start = Date.now();
  let client;
  try {
    client = getClaude();
  } catch (e) {
    return { ok: false, error: (e as Error).message, durationMs: Date.now() - start };
  }
  try {
    const response = await client.messages.create({
      // Opus for the highest-quality formal Thai drafting. The deployment
      // target (Railway) has no serverless timeout, so a full, multi-page
      // คำสั่ง can generate without the Vercel 60s constraint.
      model: MODELS.OPUS,
      max_tokens: 6000,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildLetterUserPrompt(input) }],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "AI ไม่ได้คืน text", durationMs: Date.now() - start };
    }
    const parsed = parseClaudeJson<LetterCore>(block.text, LETTER_FALLBACK);
    if (!parsed.subject || parsed.subject === LETTER_FALLBACK.subject) {
      return { ok: false, error: "AI ไม่ได้คืนหนังสือที่ใช้ได้ — ลองอีกครั้ง", durationMs: Date.now() - start };
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
    return { ok: false, error: (e as Error).message || "เกิดข้อผิดพลาด", durationMs: Date.now() - start };
  }
}

// ── STEP 2: matchAlignment ─────────────────────
// Input: the drafted letter summary + full candidate plans. Output is tiny
// (IDs + explanation) so this is fast despite the large plans context.

export interface AlignmentInput {
  letterSummary: string; // subject + objective + directives joined
  candidatePlans: DrafterInput["candidatePlans"];
}

const ALIGNMENT_FALLBACK: CommandAlignment = {
  nationalStrategyItemIds: [],
  masterPlanItemIds: [],
  actionPlanItemIds: [],
  explanation: "",
};

export async function matchAlignment(input: AlignmentInput): Promise<StepOutcome<CommandAlignment>> {
  const start = Date.now();
  let client;
  try {
    client = getClaude();
  } catch (e) {
    return { ok: false, error: (e as Error).message, durationMs: Date.now() - start };
  }

  const ns = input.candidatePlans.nationalStrategy
    .map((i) => `  [${i.id}] ${i.number} ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");
  const mp = input.candidatePlans.masterPlans
    .map((i) => `  [${i.id}] ${i.number} ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");
  const ap = input.candidatePlans.actionPlans
    .map((i) => `  [${i.id}] ${i.name}${i.description ? ` — ${i.description.slice(0, 100)}` : ""}`)
    .join("\n");

  const sys = `คุณเป็นผู้เชี่ยวชาญด้านยุทธศาสตร์ตำรวจ จับคู่ "คำสั่ง" กับแผนยุทธศาสตร์ ๓ ระดับ
หลักการ: ระดับ ๓ (แผนปฏิบัติฯ ตร.) จับคู่ก่อน → ระดับ ๒ สอดคล้องระดับ ๓ → ระดับ ๑ ครอบคลุมระดับ ๒
ถ้าไม่มีตัวใกล้เคียง คืน array ว่าง — ห้ามฝืนจับคู่`;

  const user = `## คำสั่งที่ต้องจับคู่
${input.letterSummary}

## แผนระดับ ๑ ยุทธศาสตร์ชาติ
${ns || "(ไม่มีข้อมูล)"}

## แผนระดับ ๒ แผนแม่บท
${mp || "(ไม่มีข้อมูล)"}

## แผนระดับ ๓ แผนปฏิบัติราชการ ตร.
${ap || "(ไม่มีข้อมูล)"}

---
ตอบกลับ JSON เท่านั้น (ใส่ id ที่อยู่ใน [...] หน้าชื่อ):
{
  "actionPlanItemIds": ["<id ระดับ ๓>"],
  "masterPlanItemIds": ["<id ระดับ ๒>"],
  "nationalStrategyItemIds": ["<id ระดับ ๑>"],
  "explanation": "เหตุผลการจับคู่ (๒-๓ ประโยค)"
}`;

  try {
    const response = await client.messages.create({
      model: MODELS.OPUS,
      max_tokens: 1500,
      system: sys,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "AI ไม่ได้คืน text", durationMs: Date.now() - start };
    }
    const parsed = parseClaudeJson<CommandAlignment>(block.text, ALIGNMENT_FALLBACK);
    return {
      ok: true,
      result: {
        nationalStrategyItemIds: parsed.nationalStrategyItemIds ?? [],
        masterPlanItemIds: parsed.masterPlanItemIds ?? [],
        actionPlanItemIds: parsed.actionPlanItemIds ?? [],
        explanation: parsed.explanation ?? "",
      },
      model: MODELS.OPUS,
      durationMs: Date.now() - start,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "เกิดข้อผิดพลาด", durationMs: Date.now() - start };
  }
}

// ── STEP 3: suggestKpisAndTargets ──────────────

export interface KpisInput {
  letterSummary: string;
  recipient: string;
  candidateUnits?: DrafterInput["candidateUnits"];
}

export interface KpisResult {
  suggestedKpis: KpiDefinition[];
  suggestedTargetUnitIds: string[];
  suggestedCascadeMode: "DIRECT" | "CASCADE";
  suggestedDurationDays: number;
}

const KPIS_FALLBACK: KpisResult = {
  suggestedKpis: [],
  suggestedTargetUnitIds: [],
  suggestedCascadeMode: "CASCADE",
  suggestedDurationDays: 30,
};

export async function suggestKpisAndTargets(input: KpisInput): Promise<StepOutcome<KpisResult>> {
  const start = Date.now();
  let client;
  try {
    client = getClaude();
  } catch (e) {
    return { ok: false, error: (e as Error).message, durationMs: Date.now() - start };
  }

  const units = (input.candidateUnits ?? []).filter((u) => u.level <= 3);
  const unitsBlock = units.length === 0
    ? "(ไม่มีข้อมูล)"
    : units.map((u) => `  [${u.id}] ${u.shortName ?? u.code} — ${u.name} (level ${u.level})`).join("\n");

  const sys = `คุณเป็นผู้เชี่ยวชาญออกแบบ KPI และเลือกหน่วยรับคำสั่งของตำรวจ
แนะนำ KPI ที่วัดผลได้ (เชิงปริมาณ + เชิงคุณภาพ) และจับคู่หน่วยรับให้ตรงกับ recipient`;

  const user = `## คำสั่ง
${input.letterSummary}

## หน่วยรับที่ร่างไว้ (recipient)
${input.recipient}

## หน่วยงานที่ส่งคำสั่งได้ (candidate units)
${unitsBlock}

---
ตอบกลับ JSON เท่านั้น (กระชับ — แนะนำ ๒-๔ KPI, description สั้น ๑ บรรทัด):
{
  "suggestedKpis": [
    {"id":"k1","type":"QUANTITATIVE","metric":"...","unit":"...","targetTotal":100,"reportFrequency":"DAILY","description":"สั้นๆ"},
    {"id":"k2","type":"QUALITATIVE","metric":"รายงานสรุปผล","reportFrequency":"END_OF_PERIOD","description":"สั้นๆ"}
  ],
  "suggestedTargetUnitIds": ["<u-... ที่ตรงกับ recipient>"],
  "suggestedCascadeMode": "CASCADE | DIRECT",
  "suggestedDurationDays": 30
}

หลักการ: แนะนำ ๒-๔ KPI พอ (อย่าเกิน) · description ไม่เกิน ๑ บรรทัด · จับคู่ recipient กับ candidate units · ถ้าครอบหลายหน่วยใช้ CASCADE · duration อ่านจากคำสั่ง`;

  try {
    const response = await client.messages.create({
      model: MODELS.OPUS,
      max_tokens: 3000,
      system: sys,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "AI ไม่ได้คืน text", durationMs: Date.now() - start };
    }
    const parsed = parseClaudeJson<KpisResult>(block.text, KPIS_FALLBACK);
    const kpis = (parsed.suggestedKpis ?? []).map((k, idx) => ({
      ...k,
      id: k.id ?? `kpi-${Date.now()}-${idx}`,
    })) as KpiDefinition[];
    let targetIds = parsed.suggestedTargetUnitIds ?? [];
    if (input.candidateUnits) {
      const valid = new Set(input.candidateUnits.map((u) => u.id));
      targetIds = targetIds.filter((id) => valid.has(id));
    }
    const days = Math.min(365, Math.max(1, Math.round(parsed.suggestedDurationDays ?? 30)));
    return {
      ok: true,
      result: {
        suggestedKpis: kpis,
        suggestedTargetUnitIds: targetIds,
        suggestedCascadeMode: parsed.suggestedCascadeMode === "DIRECT" ? "DIRECT" : "CASCADE",
        suggestedDurationDays: days,
      },
      model: MODELS.OPUS,
      durationMs: Date.now() - start,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "เกิดข้อผิดพลาด", durationMs: Date.now() - start };
  }
}
