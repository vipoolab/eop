/**
 * Seed script for EOP DB
 * Run: npx prisma db seed
 *
 * Creates:
 * - 6 Units (ตาม TOR PoC 2 — ยศ./ผบ./มค./มข./วจ./อจ.)
 * - 5 Users (1 per role)
 * - 3 Strategic Plans (ชาติ/แม่บท/ปฏิบัติราชการ)
 * - Sample KPIs
 */

import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Prisma 7 ต้องใช้ adapter — ไม่สามารถผ่าน connection URL ได้ตรงๆ
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Type aliases สำหรับ enum (Prisma 7 ไม่ export enum โดยตรง)
type UserRole = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";
type PlanLevel = "NATIONAL" | "MASTER" | "ACTION";

async function main() {
  console.log("🌱 Seeding database...");

  // ────────────────────────────────────────────
  // 1. Units (TOR PoC 2 — 6 หมวด)
  // ────────────────────────────────────────────
  console.log("Creating units...");

  const units = await Promise.all([
    prisma.unit.upsert({
      where: { code: "ยศ." },
      update: {},
      create: {
        code: "ยศ.",
        name: "กองยุทธศาสตร์",
        description: "วางแผน นโยบาย วิเคราะห์",
      },
    }),
    prisma.unit.upsert({
      where: { code: "ผบ." },
      update: {},
      create: {
        code: "ผบ.",
        name: "กองแผนงานอำนวยการ",
        description: "งบประมาณ บุคลากร พัสดุ IT",
      },
    }),
    prisma.unit.upsert({
      where: { code: "มค." },
      update: {},
      create: {
        code: "มค.",
        name: "กองแผนงานความมั่นคง",
        description: "ความมั่นคง การข่าว ก่อการร้าย",
      },
    }),
    prisma.unit.upsert({
      where: { code: "มข." },
      update: {},
      create: {
        code: "มข.",
        name: "กองแผนงานกิจการพิเศษ",
        description: "งานพิเศษ ปฏิบัติการพิเศษ",
      },
    }),
    prisma.unit.upsert({
      where: { code: "วจ." },
      update: {},
      create: {
        code: "วจ.",
        name: "กองวิจัย",
        description: "งานวิจัย ประเมินผล R&D",
      },
    }),
    prisma.unit.upsert({
      where: { code: "อจ." },
      update: {},
      create: {
        code: "อจ.",
        name: "ฝ่ายอำนวยการ สยศ.ตร.",
        description: "สารบรรณ บริหารทั่วไป",
      },
    }),
  ]);

  console.log(`  ✓ Created ${units.length} units`);

  // ────────────────────────────────────────────
  // 2. Users (5 roles)
  // ────────────────────────────────────────────
  console.log("Creating users...");

  const password = await bcrypt.hash("demo1234", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "commander@eop.test" },
      update: {},
      create: {
        email: "commander@eop.test",
        name: "พล.ต.ต. สมชาย แสงทอง",
        rank: "พล.ต.ต.",
        passwordHash: password,
        role: "COMMANDER",
        unitId: units[0].id,
        mfaEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@eop.test" },
      update: {},
      create: {
        email: "staff@eop.test",
        name: "พ.ต.ท. วิชัย ใจดี",
        rank: "พ.ต.ท.",
        passwordHash: password,
        role: "STAFF",
        unitId: units[1].id,
        mfaEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@eop.test" },
      update: {},
      create: {
        email: "admin@eop.test",
        name: "พ.ต.อ. ปกครอง พลเรือน",
        rank: "พ.ต.อ.",
        passwordHash: password,
        role: "ADMIN",
        unitId: units[5].id,
        mfaEnabled: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "auditor@eop.test" },
      update: {},
      create: {
        email: "auditor@eop.test",
        name: "พ.ต.ท. ตรวจสอบ ละเอียด",
        rank: "พ.ต.ท.",
        passwordHash: password,
        role: "AUDITOR",
        unitId: units[5].id,
        mfaEnabled: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "viewer@eop.test" },
      update: {},
      create: {
        email: "viewer@eop.test",
        name: "ร.ต.อ. ดูข้อมูล อย่างเดียว",
        rank: "ร.ต.อ.",
        passwordHash: password,
        role: "VIEWER",
        unitId: units[4].id,
      },
    }),
  ]);

  console.log(`  ✓ Created ${users.length} users (password: demo1234)`);

  // ────────────────────────────────────────────
  // 3. Strategic Plans (3 ระดับ ตาม TOR 1.1.2)
  // ────────────────────────────────────────────
  console.log("Creating strategic plans...");

  const nationalPlan = await prisma.strategicPlan.upsert({
    where: { id: "plan-national-2570" },
    update: {},
    create: {
      id: "plan-national-2570",
      level: "NATIONAL",
      code: "NAT-20Y-001",
      title: "ยุทธศาสตร์ชาติ 20 ปี (พ.ศ. 2561-2580)",
      description: "ความมั่นคง / ขีดความสามารถในการแข่งขัน / การพัฒนาทรัพยากรมนุษย์ / สังคม / การเติบโตที่เป็นมิตรกับสิ่งแวดล้อม / การบริหารราชการ",
      startDate: new Date("2018-01-01"),
      endDate: new Date("2037-12-31"),
    },
  });

  const masterPlan = await prisma.strategicPlan.upsert({
    where: { id: "plan-master-security" },
    update: {},
    create: {
      id: "plan-master-security",
      level: "MASTER",
      code: "MAS-SEC-001",
      title: "แผนแม่บทประเด็นความมั่นคง",
      description: "ความมั่นคงในประเทศ + ปกครอง + เศรษฐกิจ + สังคม",
      parentId: nationalPlan.id,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2027-12-31"),
    },
  });

  const actionPlan = await prisma.strategicPlan.upsert({
    where: { id: "plan-action-tor-2569" },
    update: {},
    create: {
      id: "plan-action-tor-2569",
      level: "ACTION",
      code: "ACT-RTP-69",
      title: "แผนปฏิบัติราชการ สำนักงานตำรวจแห่งชาติ ประจำปี 2569",
      description: "แผนการดำเนินงานปีงบประมาณ พ.ศ. 2569",
      parentId: masterPlan.id,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  console.log(`  ✓ Created 3 strategic plans`);

  // ────────────────────────────────────────────
  // 4. KPIs (ตาม TOR 1.3)
  // ────────────────────────────────────────────
  console.log("Creating KPIs...");

  const kpis = await Promise.all([
    prisma.kpi.create({
      data: {
        planId: actionPlan.id,
        code: "KPI-001",
        name: "อัตราการจับกุมคดีอาญา",
        description: "ร้อยละการจับกุมคดีอาญา 5 ประเภทหลัก",
        target: 70.0,
        actual: 58.3,
        unit: "%",
        period: "Q2/2569",
        status: "yellow",
      },
    }),
    prisma.kpi.create({
      data: {
        planId: actionPlan.id,
        code: "KPI-002",
        name: "ระยะเวลาประมวลผลคำสั่ง",
        description: "ระยะเวลาเฉลี่ยจากการร่างถึงเผยแพร่ของหนังสือสั่งการ",
        target: 1.0,
        actual: 2.5,
        unit: "วัน",
        period: "Q2/2569",
        status: "red",
      },
    }),
    prisma.kpi.create({
      data: {
        planId: actionPlan.id,
        code: "KPI-003",
        name: "อัตราการรับทราบคำสั่ง",
        description: "ร้อยละหน่วยงานที่รับทราบในเวลากำหนด",
        target: 95.0,
        actual: 87.5,
        unit: "%",
        period: "Q2/2569",
        status: "yellow",
      },
    }),
  ]);

  console.log(`  ✓ Created ${kpis.length} KPIs`);

  // ────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────
  console.log("\n✅ Seed completed successfully!\n");
  console.log("📝 Demo accounts (password: demo1234):");
  for (const user of users) {
    console.log(`   ${user.email.padEnd(25)} → ${user.role}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
