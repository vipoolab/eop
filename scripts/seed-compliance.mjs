// Seed Compliance Templates — 4 standards (ก.พ.ร./ITA/PMQA/ระบบราชการ 4.0)
// TOR 5.4.3 ๓.๑

import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TEMPLATES = [
  {
    standard: "GOR_POR_ROR",
    code: "KPR-2569-Q",
    name: "ก.พ.ร. ตัวชี้วัดผลการปฏิบัติราชการ ปีงบประมาณ 2569 (ไตรมาส)",
    version: "1.0",
    effectiveDate: new Date("2025-10-01"),
    items: [
      { code: "1.1", category: "การให้บริการประชาชน", question: "ระดับความพึงพอใจของผู้รับบริการต่อการให้บริการของหน่วยงาน", weight: 2.0, evidenceRequired: true },
      { code: "1.2", category: "การให้บริการประชาชน", question: "ระยะเวลาเฉลี่ยในการให้บริการตามภารกิจหลัก (เป้าหมาย ≤ 30 นาที)", weight: 1.5, evidenceRequired: true },
      { code: "2.1", category: "ประสิทธิภาพการปฏิบัติราชการ", question: "อัตราการเบิกจ่ายงบประมาณตามไตรมาส", weight: 1.5, evidenceRequired: true },
      { code: "2.2", category: "ประสิทธิภาพการปฏิบัติราชการ", question: "ร้อยละการบรรลุเป้าหมาย KPI หลักของหน่วยงาน", weight: 2.0, evidenceRequired: true },
      { code: "2.3", category: "ประสิทธิภาพการปฏิบัติราชการ", question: "การลดต้นทุน/ระยะเวลา/ขั้นตอน อย่างน้อย 10%", weight: 1.0, evidenceRequired: false },
      { code: "3.1", category: "การพัฒนาองค์กร", question: "การพัฒนาบุคลากร ≥ 20 ชั่วโมง/คน/ปี", weight: 1.0, evidenceRequired: true },
      { code: "3.2", category: "การพัฒนาองค์กร", question: "อัตราการใช้เทคโนโลยีดิจิทัลในการปฏิบัติงาน", weight: 1.0, evidenceRequired: false },
      { code: "4.1", category: "ธรรมาภิบาล", question: "การเปิดเผยข้อมูลภาครัฐครบถ้วนตามเกณฑ์", weight: 1.5, evidenceRequired: true },
      { code: "4.2", category: "ธรรมาภิบาล", question: "การจัดทำคู่มือประชาชนและเผยแพร่", weight: 1.0, evidenceRequired: true },
      { code: "5.1", category: "นวัตกรรม", question: "จำนวนนวัตกรรมที่นำมาใช้ในการบริการประชาชน", weight: 1.0, evidenceRequired: false },
      { code: "5.2", category: "นวัตกรรม", question: "การทำงานข้ามหน่วยงาน (Cross-functional)", weight: 1.0, evidenceRequired: false },
      { code: "6.1", category: "ผลลัพธ์การบริหารราชการ", question: "ผลกระทบเชิงบวกต่อสังคม/เศรษฐกิจ (Impact Score)", weight: 2.5, evidenceRequired: true },
    ],
  },
  {
    standard: "ITA",
    code: "ITA-2569",
    name: "ITA — Integrity & Transparency Assessment ปีงบประมาณ 2569",
    version: "1.0",
    effectiveDate: new Date("2025-10-01"),
    items: [
      { code: "I1.1", category: "การปฏิบัติหน้าที่", question: "เจ้าหน้าที่ปฏิบัติงานตามหน้าที่ด้วยความซื่อสัตย์", weight: 2.0, evidenceRequired: false },
      { code: "I1.2", category: "การปฏิบัติหน้าที่", question: "การให้บริการประชาชนเท่าเทียมและไม่เลือกปฏิบัติ", weight: 2.0, evidenceRequired: false },
      { code: "I2.1", category: "การใช้งบประมาณ", question: "การใช้งบประมาณโปร่งใส ตรวจสอบได้", weight: 2.0, evidenceRequired: true },
      { code: "I2.2", category: "การใช้งบประมาณ", question: "การจัดซื้อจัดจ้างเป็นไปตามระเบียบ", weight: 2.0, evidenceRequired: true },
      { code: "I3.1", category: "การใช้อำนาจ", question: "การใช้อำนาจในการบริหารงานบุคคลโปร่งใส", weight: 1.5, evidenceRequired: false },
      { code: "I3.2", category: "การใช้อำนาจ", question: "การใช้ดุลพินิจในการตัดสินใจมีหลักเกณฑ์ชัดเจน", weight: 1.5, evidenceRequired: false },
      { code: "I4.1", category: "การใช้ทรัพย์สินทางราชการ", question: "การใช้ทรัพย์สินทางราชการเพื่อประโยชน์ราชการ", weight: 2.0, evidenceRequired: true },
      { code: "I5.1", category: "การแก้ไขปัญหาทุจริต", question: "การมีนโยบายและมาตรการป้องกันการทุจริต", weight: 2.0, evidenceRequired: true },
      { code: "O6.1", category: "คุณภาพการดำเนินงาน", question: "การให้บริการตรงเวลาและเป็นมาตรฐาน", weight: 1.5, evidenceRequired: false },
      { code: "O6.2", category: "คุณภาพการดำเนินงาน", question: "การให้ข้อมูลถูกต้องและครบถ้วน", weight: 1.5, evidenceRequired: false },
      { code: "O7.1", category: "ประสิทธิภาพการสื่อสาร", question: "การเผยแพร่ข้อมูลผ่านช่องทางต่างๆ ครบถ้วน", weight: 1.0, evidenceRequired: true },
      { code: "O8.1", category: "การปรับปรุงระบบการทำงาน", question: "การทบทวนปรับปรุงคุณภาพการทำงาน", weight: 1.0, evidenceRequired: false },
      { code: "T9.1", category: "การเปิดเผยข้อมูล", question: "การเปิดเผยข้อมูลภาครัฐผ่านเว็บไซต์ครบถ้วน 33 ข้อ", weight: 3.0, evidenceRequired: true },
      { code: "T10.1", category: "การป้องกันการทุจริต", question: "การประเมินความเสี่ยงทุจริต", weight: 2.0, evidenceRequired: true },
    ],
  },
  {
    standard: "PMQA",
    code: "PMQA-2569",
    name: "PMQA — รางวัลคุณภาพการบริหารจัดการภาครัฐ ปี 2569",
    version: "4.0",
    effectiveDate: new Date("2025-10-01"),
    items: [
      { code: "P1", category: "หมวด 1 — การนำองค์การ", question: "วิสัยทัศน์และค่านิยมที่ผู้บริหารกำหนดและสื่อสารทั่วองค์การ", weight: 2.0, evidenceRequired: true },
      { code: "P1.2", category: "หมวด 1 — การนำองค์การ", question: "ระบบการกำกับดูแลและความรับผิดชอบต่อสังคม", weight: 2.0, evidenceRequired: true },
      { code: "P2", category: "หมวด 2 — การวางแผนยุทธศาสตร์", question: "กระบวนการจัดทำแผนยุทธศาสตร์ที่เชื่อมโยงกับยุทธศาสตร์ชาติ", weight: 2.5, evidenceRequired: true },
      { code: "P2.2", category: "หมวด 2 — การวางแผนยุทธศาสตร์", question: "การถ่ายทอดและติดตามแผนสู่ผู้ปฏิบัติ", weight: 2.0, evidenceRequired: true },
      { code: "P3", category: "หมวด 3 — ผู้รับบริการและผู้มีส่วนได้ส่วนเสีย", question: "การฟังเสียงผู้รับบริการและนำมาปรับปรุง", weight: 2.5, evidenceRequired: true },
      { code: "P4", category: "หมวด 4 — การจัดการความรู้และสารสนเทศ", question: "ระบบการบริหารจัดการข้อมูลและสารสนเทศ", weight: 2.0, evidenceRequired: false },
      { code: "P5", category: "หมวด 5 — บุคลากร", question: "กระบวนการพัฒนาและจูงใจบุคลากร", weight: 2.0, evidenceRequired: true },
      { code: "P6", category: "หมวด 6 — การปฏิบัติการ", question: "การออกแบบและจัดการกระบวนการทำงานหลัก", weight: 2.5, evidenceRequired: true },
      { code: "P7", category: "หมวด 7 — ผลลัพธ์", question: "ผลลัพธ์ด้านการให้บริการประชาชนและประสิทธิภาพ", weight: 3.0, evidenceRequired: true },
    ],
  },
  {
    standard: "GOV4_0",
    code: "GOV4-2569",
    name: "ระบบราชการ 4.0 — รายงานประจำปี OPDC 2569",
    version: "1.0",
    effectiveDate: new Date("2025-10-01"),
    items: [
      { code: "G1", category: "เปิดกว้างเชื่อมโยงกัน (Open & Connected)", question: "การเปิดเผยข้อมูลภาครัฐผ่านระบบ Open Data", weight: 2.0, evidenceRequired: true },
      { code: "G1.2", category: "เปิดกว้างเชื่อมโยงกัน (Open & Connected)", question: "การเชื่อมโยงข้อมูลข้ามหน่วยงาน (Data Sharing)", weight: 2.0, evidenceRequired: true },
      { code: "G2", category: "ยึดประชาชนเป็นศูนย์กลาง (Citizen-Centric)", question: "การให้บริการประชาชนแบบ One Stop Service", weight: 2.0, evidenceRequired: true },
      { code: "G2.2", category: "ยึดประชาชนเป็นศูนย์กลาง (Citizen-Centric)", question: "ระบบรับฟัง/ตอบกลับข้อร้องเรียนผ่าน Digital Channel", weight: 1.5, evidenceRequired: true },
      { code: "G3", category: "ปรับตัวเปลี่ยนแปลง (Smart & High Performance)", question: "การใช้ AI/Big Data ในการตัดสินใจ", weight: 2.0, evidenceRequired: false },
      { code: "G3.2", category: "ปรับตัวเปลี่ยนแปลง (Smart & High Performance)", question: "การพัฒนาทักษะดิจิทัลของบุคลากร", weight: 1.5, evidenceRequired: true },
      { code: "G4", category: "การใช้นวัตกรรม (Innovation)", question: "จำนวนนวัตกรรมที่นำมาใช้ในการบริการ", weight: 1.5, evidenceRequired: false },
      { code: "G5", category: "ธรรมาภิบาลและความโปร่งใส", question: "การประเมิน ITA ของหน่วยงาน", weight: 2.0, evidenceRequired: true },
      { code: "G6", category: "การพัฒนาขีดความสามารถองค์กร", question: "การเข้าร่วม PMQA หรือรางวัลคุณภาพ", weight: 1.5, evidenceRequired: true },
      { code: "G7", category: "ผลลัพธ์ภาพรวม", question: "ความพึงพอใจประชาชน ≥ 85%", weight: 3.0, evidenceRequired: true },
    ],
  },
];

console.log("🌱 Seeding Compliance Templates...");
let createdCount = 0;
let skippedCount = 0;

for (const t of TEMPLATES) {
  const existing = await prisma.complianceTemplate.findUnique({
    where: { code: t.code },
  });
  if (existing) {
    console.log(`  ⏭  Skip ${t.code} (exists)`);
    skippedCount++;
    continue;
  }
  await prisma.complianceTemplate.create({
    data: {
      standard: t.standard,
      code: t.code,
      name: t.name,
      version: t.version,
      effectiveDate: t.effectiveDate,
      items: {
        create: t.items.map((it, i) => ({
          code: it.code,
          category: it.category,
          question: it.question,
          weight: it.weight,
          order: i,
          evidenceRequired: it.evidenceRequired,
        })),
      },
    },
  });
  console.log(`  ✓ ${t.code} — ${t.items.length} items`);
  createdCount++;
}

console.log(`\nDone: ${createdCount} created, ${skippedCount} skipped`);
await prisma.$disconnect();
