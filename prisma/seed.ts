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
      update: { name: "สมชาย แสงทอง", rank: "พล.ต.ต." },
      create: {
        email: "commander@eop.test",
        name: "สมชาย แสงทอง",
        rank: "พล.ต.ต.",
        passwordHash: password,
        role: "COMMANDER",
        unitId: units[0].id,
        mfaEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@eop.test" },
      update: { name: "วิชัย ใจดี", rank: "พ.ต.ท." },
      create: {
        email: "staff@eop.test",
        name: "วิชัย ใจดี",
        rank: "พ.ต.ท.",
        passwordHash: password,
        role: "STAFF",
        unitId: units[1].id,
        mfaEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@eop.test" },
      update: { name: "ปกครอง พลเรือน", rank: "พ.ต.อ." },
      create: {
        email: "admin@eop.test",
        name: "ปกครอง พลเรือน",
        rank: "พ.ต.อ.",
        passwordHash: password,
        role: "ADMIN",
        unitId: units[5].id,
        mfaEnabled: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "auditor@eop.test" },
      update: { name: "ตรวจสอบ ละเอียด", rank: "พ.ต.ท." },
      create: {
        email: "auditor@eop.test",
        name: "ตรวจสอบ ละเอียด",
        rank: "พ.ต.ท.",
        passwordHash: password,
        role: "AUDITOR",
        unitId: units[5].id,
        mfaEnabled: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "viewer@eop.test" },
      update: { name: "ดูข้อมูล อย่างเดียว", rank: "ร.ต.อ." },
      create: {
        email: "viewer@eop.test",
        name: "ดูข้อมูล อย่างเดียว",
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

  // Idempotent: delete existing KPIs for this plan, then re-create
  // (kpi.code is not unique in schema — using deleteMany+create combo)
  await prisma.kpi.deleteMany({ where: { planId: actionPlan.id } });

  const kpiData = [
    {
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
    {
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
    {
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
  ];

  const kpis = await Promise.all(
    kpiData.map((data) => prisma.kpi.create({ data }))
  );

  console.log(`  ✓ Created ${kpis.length} KPIs`);

  // ────────────────────────────────────────────
  // 5. Sample Commands (กระจาย 9 สถานะ)
  // ────────────────────────────────────────────
  console.log("Creating sample commands...");

  const commander = users[0]; // commander@eop.test
  const staff = users[1]; // staff@eop.test

  const sampleCommands = [
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๑",
      subject: "เร่งรัดการดำเนินคดียาเสพติดในพื้นที่ภาคใต้",
      recipient: "ผบช.มค., ผบช.ผบ., ผกก.สน. ทุก สน. ในภาค ๙",
      reference: "หนังสือ ตร ที่ ๐๐๐๑.๒๖/๔๒",
      objective: "ลดอัตราการแพร่ระบาดของยาเสพติดในไตรมาส ๔",
      body: "ด้วยสถิติคดีอาญาเกี่ยวกับยาเสพติดในพื้นที่ภาคใต้มีแนวโน้มเพิ่มขึ้น จึงขอความร่วมมือทุกหน่วยให้เพิ่มความเข้มข้นในการตรวจ จัดจุดตรวจ และระดมกวาดล้างประจำสัปดาห์",
      priority: "HIGH" as const,
      status: "CLOSED" as const,
      creatorId: commander.id,
      signerId: commander.id,
      publishedAt: new Date("2026-03-15"),
      closedAt: new Date("2026-04-20"),
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๒",
      subject: "กำหนดมาตรการรักษาความปลอดภัยช่วงเทศกาลสงกรานต์ ๒๕๖๙",
      recipient: "ผบช., ผบก. ทุกพื้นที่",
      objective: "ลดอุบัติเหตุและรักษาความปลอดภัยช่วงเทศกาล",
      body: "ในช่วงเทศกาลสงกรานต์ระหว่างวันที่ ๑๓-๑๕ เมษายน ๒๕๖๙ ขอให้ทุกหน่วยจัดกำลังเสริมตามแผน และตั้งจุดตรวจวัดแอลกอฮอล์ทุก ๕ กิโลเมตรตามเส้นทางสายหลัก",
      priority: "URGENT" as const,
      status: "IN_PROGRESS" as const,
      creatorId: commander.id,
      signerId: commander.id,
      publishedAt: new Date("2026-04-10"),
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๓",
      subject: "แต่งตั้งคณะทำงานติดตามผลโครงการ EOP",
      recipient: "ผบ.สยศ.ตร., ผบช.ยศ.",
      objective: "ติดตามผลการพัฒนาและใช้งานระบบ EOP",
      body: "ตามที่ ตร. ได้อนุมัติให้พัฒนาระบบ EOP เพื่อยกระดับการบริหารยุทธศาสตร์ ขอแต่งตั้งคณะทำงานติดตามผลโครงการประกอบด้วย...",
      priority: "NORMAL" as const,
      status: "ACKNOWLEDGED" as const,
      creatorId: commander.id,
      signerId: commander.id,
      publishedAt: new Date("2026-05-01"),
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๔",
      subject: "ขอเชิญประชุมคณะกรรมการประเมิน ITA ประจำปี ๒๕๖๙",
      recipient: "อจ.สยศ.ตร., วจ.",
      body: "ขอเชิญร่วมประชุมคณะกรรมการประเมิน ITA ในวันที่ ๓๐ พฤษภาคม ๒๕๖๙ ณ ห้องประชุม สยศ.ตร. ชั้น ๕",
      priority: "NORMAL" as const,
      status: "PUBLISHED" as const,
      creatorId: commander.id,
      signerId: commander.id,
      publishedAt: new Date("2026-05-12"),
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๕",
      subject: "การจัดตั้งศูนย์ปฏิบัติการพิเศษระหว่างเทศกาลคริสต์มาส",
      recipient: "ผบช.มค., ผกก. ในพื้นที่ กทม.",
      body: "เพื่อรักษาความปลอดภัยช่วงเทศกาลคริสต์มาส ขอจัดตั้งศูนย์ปฏิบัติการพิเศษและจัดกำลังเสริม...",
      priority: "HIGH" as const,
      status: "APPROVED" as const,
      creatorId: staff.id,
      signerId: commander.id,
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๖",
      subject: "ขอความร่วมมือสำรวจอัตรากำลังประจำสถานี",
      recipient: "ผกก.สน. ทุก สน.",
      body: "เพื่อจัดทำแผนพัฒนาบุคลากร ขอให้ทุก สน. รายงานอัตรากำลังที่เป็นปัจจุบัน จำแนกตามหน้าที่",
      priority: "NORMAL" as const,
      status: "SUBMITTED" as const,
      creatorId: staff.id,
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๗",
      subject: "การปฏิบัติงานช่วงเลือกตั้งท้องถิ่น พ.ศ. ๒๕๖๙",
      recipient: "ผบช., ผบก. ทุกพื้นที่",
      body: "ในช่วงเลือกตั้งท้องถิ่น ขอให้ทุกหน่วยเข้มข้นในการรักษาความสงบเรียบร้อย...",
      priority: "URGENT" as const,
      status: "DRAFT" as const,
      creatorId: commander.id,
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๘",
      subject: "รายงานผลการกวาดล้างแหล่งอบายมุข ไตรมาส ๒",
      recipient: "ผบช. ที่เกี่ยวข้อง",
      body: "สรุปผลการกวาดล้างแหล่งอบายมุขในไตรมาส ๒ พบว่าสามารถจับกุมได้ ๑๒๐ ราย ยึดของกลางมูลค่า...",
      priority: "NORMAL" as const,
      status: "REPORTED" as const,
      creatorId: staff.id,
      signerId: commander.id,
      publishedAt: new Date("2026-04-01"),
    },
    {
      docNo: "ตร ๐๐๐๑.๖๙/๐๐๐๙",
      subject: "ตรวจสอบผลปฏิบัติงานป้องกันและปราบปรามยาเสพติด",
      recipient: "ฝ่ายอำนวยการ สยศ.ตร.",
      body: "ตรวจสอบผลการปฏิบัติงานป้องกันและปราบปรามยาเสพติดในไตรมาส ๑ พบว่าหน่วยปฏิบัติสามารถดำเนินการตามแผน...",
      priority: "NORMAL" as const,
      status: "AUDITED" as const,
      creatorId: staff.id,
      signerId: commander.id,
      publishedAt: new Date("2026-03-01"),
    },
  ];

  // ─── Status progression per status (สำหรับสร้าง CommandStatusLog ย้อนหลัง)
  const STATUS_PATH: Array<"DRAFT" | "SUBMITTED" | "APPROVED" | "PUBLISHED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "REPORTED" | "AUDITED" | "CLOSED"> = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "PUBLISHED",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "REPORTED",
    "AUDITED",
    "CLOSED",
  ];

  for (const cmd of sampleCommands) {
    const command = await prisma.command.upsert({
      where: { docNo: cmd.docNo },
      update: {},
      create: cmd,
    });

    // Skip if already has targets (idempotent re-seed)
    const existingTargets = await prisma.commandTarget.count({
      where: { commandId: command.id },
    });

    if (existingTargets === 0) {
      // เลือก 2-3 units ตาม recipient (สุ่มแบบ deterministic จาก docNo)
      const numTargets = (cmd.docNo.charCodeAt(cmd.docNo.length - 1) % 3) + 2;
      const startIdx = cmd.docNo.charCodeAt(cmd.docNo.length - 2) % units.length;
      const targets = Array.from({ length: numTargets }, (_, i) => units[(startIdx + i) % units.length]);

      // ถ้าสถานะ ACKNOWLEDGED ขึ้นไป → mark all acknowledged
      const ackUpTo = STATUS_PATH.indexOf("ACKNOWLEDGED");
      const cmdStatusIdx = STATUS_PATH.indexOf(cmd.status);
      const allAck = cmdStatusIdx >= ackUpTo;
      // ถ้า PUBLISHED → ack เฉพาะบางส่วน
      const someAck = cmd.status === "PUBLISHED";

      await prisma.commandTarget.createMany({
        data: targets.map((u, i) => ({
          commandId: command.id,
          unitId: u.id,
          acknowledged: allAck || (someAck && i === 0),
          acknowledgedAt: allAck || (someAck && i === 0)
            ? cmd.publishedAt ?? new Date()
            : null,
        })),
      });
    }

    // Status log — สร้างย้อนหลังตามเส้นทาง state machine
    const existingLog = await prisma.commandStatusLog.count({
      where: { commandId: command.id },
    });

    if (existingLog === 0) {
      const targetIdx = STATUS_PATH.indexOf(cmd.status);
      const baseTime = cmd.publishedAt ?? new Date("2026-04-01");
      const logs: Array<{
        commandId: string;
        from: typeof STATUS_PATH[number] | null;
        to: typeof STATUS_PATH[number];
        byUserId: string;
        note: string | null;
        createdAt: Date;
      }> = [];

      for (let i = 0; i <= targetIdx; i++) {
        logs.push({
          commandId: command.id,
          from: i === 0 ? null : STATUS_PATH[i - 1],
          to: STATUS_PATH[i],
          byUserId: cmd.signerId ?? cmd.creatorId,
          note:
            i === 0
              ? "สร้างคำสั่ง"
              : i === STATUS_PATH.indexOf("APPROVED")
                ? "อนุมัติ"
                : i === STATUS_PATH.indexOf("CLOSED")
                  ? "ปิดงานเรียบร้อย"
                  : null,
          createdAt: new Date(baseTime.getTime() - (targetIdx - i) * 24 * 60 * 60 * 1000),
        });
      }

      await prisma.commandStatusLog.createMany({ data: logs });
    }
  }

  console.log(`  ✓ Created ${sampleCommands.length} sample commands (with targets + status log)`);

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
