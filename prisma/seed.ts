// EOP Seed v3 — covers all 64 models (DATABASE_DESIGN_v3.md)
// Demo data for pre-PoC presentation to สำนักงานยุทธศาสตร์ตำรวจ committee

import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding EOP v3 database…");

  // ─────────────────────────────────────────────
  // A. IDENTITY & ACCESS — Roles, Permissions, Units, Users
  // ─────────────────────────────────────────────

  console.log("\n📋 [A] Identity & Access");

  const roles = await Promise.all([
    prisma.role.create({ data: { code: "ADMIN", name: "ผู้ดูแลระบบ", isSystem: true, description: "เข้าถึงทุกฟีเจอร์" } }),
    prisma.role.create({ data: { code: "COMMANDER", name: "ผู้บังคับบัญชา", isSystem: true, description: "อนุมัติ + สั่งการ" } }),
    prisma.role.create({ data: { code: "STAFF", name: "เจ้าหน้าที่", isSystem: true, description: "ปฏิบัติงาน + รายงาน" } }),
    prisma.role.create({ data: { code: "AUDITOR", name: "ผู้ตรวจสอบ", isSystem: true, description: "อ่าน + audit เท่านั้น" } }),
    prisma.role.create({ data: { code: "VIEWER", name: "ผู้ดูข้อมูล", isSystem: true, description: "อ่านอย่างเดียว" } }),
  ]);

  const permissionsData = [
    ["command.create", "command", "create"],
    ["command.approve", "command", "approve"],
    ["command.publish", "command", "publish"],
    ["command.sign", "command", "sign"],
    ["plan.create", "plan", "create"],
    ["plan.import", "plan", "import"],
    ["mission.assign", "mission", "assign"],
    ["compliance.review", "compliance", "review"],
    ["user.manage", "user", "manage"],
    ["audit.read", "audit", "read"],
  ];
  const permissions = await Promise.all(
    permissionsData.map(([code, resource, action]) =>
      prisma.permission.create({ data: { code, resource, action } })
    )
  );

  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.create({ data: { roleId: roles[0].id, permissionId: p.id } })
    )
  );
  const commanderPerms = permissions.filter((p) =>
    p.resource === "command" || p.resource === "plan" || p.resource === "mission"
  );
  await Promise.all(
    commanderPerms.map((p) =>
      prisma.rolePermission.create({ data: { roleId: roles[1].id, permissionId: p.id } })
    )
  );

  // Units — TOR PoC 2 categories + hierarchy
  const sysor = await prisma.unit.create({
    data: {
      code: "สยศ.ตร.",
      name: "สำนักงานยุทธศาสตร์ตำรวจ",
      level: "NATIONAL",
      type: "COMMAND",
      latitude: 13.7563,
      longitude: 100.5018,
      address: "ถนนพระราม 1 เขตปทุมวัน กรุงเทพฯ",
      phone: "0 2205 2018",
    },
  });

  const unitsBelow = await Promise.all(
    [
      ["ยศ.", "กองยุทธศาสตร์", "DIVISION", "COMMAND"],
      ["ผบ.", "กองแผนงานอำนวยการ", "DIVISION", "SUPPORT"],
      ["มค.", "กองแผนงานความมั่นคง", "DIVISION", "SPECIAL"],
      ["มข.", "กองแผนงานกิจการพิเศษ", "DIVISION", "SPECIAL"],
      ["วจ.", "กองวิจัย", "DIVISION", "SUPPORT"],
      ["อจ.", "ฝ่ายอำนวยการ สยศ.ตร.", "DIVISION", "SUPPORT"],
    ].map(([code, name, level, type]) =>
      prisma.unit.create({
        data: {
          code,
          name,
          parentId: sysor.id,
          level: level as "NATIONAL" | "REGION" | "PROVINCE" | "STATION" | "DIVISION",
          type: type as "COMMAND" | "OPERATION" | "SUPPORT" | "SPECIAL",
          latitude: 13.7563 + Math.random() * 0.02,
          longitude: 100.5018 + Math.random() * 0.02,
        },
      })
    )
  );

  const regional = await Promise.all(
    [
      ["บช.ก.", "กองบัญชาการตำรวจกองกำลังกลาง", "REGION", 13.7, 100.5],
      ["บช.น.", "กองบัญชาการตำรวจนครบาล", "REGION", 13.75, 100.5],
      ["บช.ภ.1", "ตำรวจภูธรภาค 1", "REGION", 14.5, 100.5],
      ["บช.ภ.9", "ตำรวจภูธรภาค 9 (ใต้)", "REGION", 7.0, 100.5],
    ].map(([code, name, level, lat, lng]) =>
      prisma.unit.create({
        data: {
          code: code as string,
          name: name as string,
          level: level as "REGION",
          type: "OPERATION",
          latitude: lat as number,
          longitude: lng as number,
        },
      })
    )
  );

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const [admin, commander, staff, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@eop.test",
        name: "นางสาว ทดสอบ แอดมิน",
        rank: "ร.ต.อ.",
        position: "ผู้ดูแลระบบ",
        badgeNo: "ADM-001",
        passwordHash,
        role: "ADMIN",
        roleId: roles[0].id,
        unitId: unitsBelow[1].id,
        mfaEnabled: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "commander@eop.test",
        name: "พล.ต.อ. ทดสอบ ผู้บัญชาการ",
        rank: "พล.ต.อ.",
        position: "ผู้บัญชาการ สยศ.ตร.",
        badgeNo: "CMD-001",
        passwordHash,
        role: "COMMANDER",
        roleId: roles[1].id,
        unitId: sysor.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "staff@eop.test",
        name: "พ.ต.ต. ทดสอบ ปฏิบัติงาน",
        rank: "พ.ต.ต.",
        position: "เจ้าหน้าที่",
        badgeNo: "STF-001",
        passwordHash,
        role: "STAFF",
        roleId: roles[2].id,
        unitId: unitsBelow[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: "auditor@eop.test",
        name: "นาย ทดสอบ ผู้ตรวจสอบ",
        rank: "พ.ต.ท.",
        position: "ผู้ตรวจสอบ",
        badgeNo: "AUD-001",
        passwordHash,
        role: "AUDITOR",
        roleId: roles[3].id,
      },
    }),
  ]);

  await prisma.consentRecord.createMany({
    data: [admin, commander, staff, viewer].map((u) => ({
      userId: u.id,
      consentType: "PERSONAL_DATA" as const,
      granted: true,
      version: "PDPA-v1",
      grantedAt: new Date(),
    })),
  });

  console.log(`  ✓ Roles: ${roles.length}, Permissions: ${permissions.length}`);
  console.log(`  ✓ Units: ${1 + unitsBelow.length + regional.length}, Users: 4`);

  // ─────────────────────────────────────────────
  // B. STRATEGIC PLAN (TOR 5.4.1)
  // ─────────────────────────────────────────────

  console.log("\n🎯 [B] Strategic Plan");

  await prisma.policyDirective.create({
    data: {
      year: 2569,
      issuedById: commander.id,
      title: "นโยบาย ผบ.ตร. ประจำปี 2569 — ยกระดับความมั่นคงและบริการประชาชน",
      content: "1. ปราบปรามอาชญากรรมข้ามชาติ 2. ลดอุบัติเหตุจราจร 3. เพิ่มคุณภาพบริการประชาชน 4. ส่งเสริม Digital Transformation 5. ป้องกันยาเสพติด",
      effectiveDate: new Date("2025-10-01"),
    },
  });

  const national = await prisma.strategicPlan.create({
    data: {
      level: "NATIONAL",
      code: "NAT-20Y-001",
      title: "ยุทธศาสตร์ชาติ 20 ปี — ด้านความมั่นคง",
      description: "กรอบยุทธศาสตร์ชาติ 20 ปี (พ.ศ. 2561-2580) ด้านความมั่นคงและการบังคับใช้กฎหมาย",
      policyIntent: "สร้างความมั่นคงและความปลอดภัยให้ประชาชน ลดอาชญากรรมและความเสี่ยงทุกประเภท",
      source: "OFFICIAL",
      status: "ACTIVE",
      createdById: commander.id,
      startDate: new Date("2018-01-01"),
      endDate: new Date("2037-12-31"),
    },
  });

  const masterSec = await prisma.strategicPlan.create({
    data: {
      level: "MASTER",
      code: "MAS-SEC-001",
      title: "แผนแม่บทด้านความมั่นคง 5 ปี (2566-2570)",
      description: "ลดอาชญากรรมหลัก + เพิ่มประสิทธิภาพการบังคับใช้กฎหมาย",
      policyIntent: "ลดสถิติคดีรุนแรงไม่น้อยกว่า 20% + เพิ่มอัตราการจับกุม 30%",
      source: "OFFICIAL",
      parentId: national.id,
      createdById: commander.id,
      startDate: new Date("2023-10-01"),
      endDate: new Date("2027-09-30"),
    },
  });

  const masterSvc = await prisma.strategicPlan.create({
    data: {
      level: "MASTER",
      code: "MAS-SVC-002",
      title: "แผนแม่บทพัฒนาคุณภาพบริการประชาชน",
      description: "ลดเวลารอ + เพิ่มความพึงพอใจประชาชน",
      policyIntent: "ลดเวลารับคำร้อง < 15 นาที + พึงพอใจ > 85%",
      source: "OFFICIAL",
      parentId: national.id,
      createdById: commander.id,
      startDate: new Date("2023-10-01"),
      endDate: new Date("2027-09-30"),
    },
  });

  const action1 = await prisma.strategicPlan.create({
    data: {
      level: "ACTION",
      code: "ACT-NCB-69",
      title: "แผนปฏิบัติราชการปราบปรามยาเสพติด ปี 2569",
      description: "เร่งรัดคดียาเสพติด + ตัดวงจรเครือข่าย",
      policyIntent: "เพิ่มอัตราการจับกุม 30% เทียบปี 68 + ยึดทรัพย์เพิ่ม 50%",
      source: "MANUAL",
      parentId: masterSec.id,
      createdById: commander.id,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  const action2 = await prisma.strategicPlan.create({
    data: {
      level: "ACTION",
      code: "ACT-RTP-69",
      title: "แผนปฏิบัติราชการลดอุบัติเหตุจราจร ปี 2569",
      description: "ลดอุบัติเหตุ + ลดเสียชีวิตจากการจราจร",
      policyIntent: "ลดเสียชีวิตจากอุบัติเหตุ ≥15% เทียบปี 68",
      source: "MANUAL",
      parentId: masterSec.id,
      createdById: commander.id,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  const action3 = await prisma.strategicPlan.create({
    data: {
      level: "ACTION",
      code: "ACT-SVC-69",
      title: "แผนปฏิบัติราชการพัฒนาบริการประชาชน ปี 2569",
      description: "ปรับปรุงสน. + ลดเวลารอ",
      policyIntent: "ปรับปรุง 100 สน. + ลดเวลารับคำร้อง <10 นาที",
      source: "MANUAL",
      parentId: masterSvc.id,
      createdById: commander.id,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-09-30"),
    },
  });

  await prisma.planLinkage.create({
    data: {
      sourcePlanId: action1.id,
      targetPlanId: masterSec.id,
      linkType: "SUPPORTS",
      strength: 0.95,
      analyzedBy: "ai",
    },
  });

  const kpis = await Promise.all([
    prisma.kpi.create({
      data: {
        planId: action1.id, code: "KPI-001",
        name: "อัตราการจับกุมคดียาเสพติด",
        description: "เปอร์เซ็นต์เทียบปีฐาน 2568",
        target: 30, actual: 18.5, unit: "%", period: "Q2/2569", status: "yellow",
        measurementType: "QUANTITATIVE",
        ownerId: commander.id,
      },
    }),
    prisma.kpi.create({
      data: {
        planId: action1.id, code: "KPI-002",
        name: "มูลค่าทรัพย์สินยึดได้",
        target: 500, actual: 320, unit: "ล้านบาท", period: "Q2/2569", status: "yellow",
        measurementType: "QUANTITATIVE",
        ownerId: staff.id,
      },
    }),
    prisma.kpi.create({
      data: {
        planId: action2.id, code: "KPI-003",
        name: "จำนวนเสียชีวิตจากอุบัติเหตุ",
        target: -15, actual: -8.2, unit: "% (ลดลง)", period: "Q2/2569", status: "yellow",
        measurementType: "QUANTITATIVE",
        ownerId: staff.id,
      },
    }),
    prisma.kpi.create({
      data: {
        planId: action3.id, code: "KPI-004",
        name: "เวลารับคำร้องประชาชน",
        target: 10, actual: 12.5, unit: "นาที", period: "Q2/2569", status: "red",
        measurementType: "QUANTITATIVE",
        ownerId: staff.id,
      },
    }),
    prisma.kpi.create({
      data: {
        planId: action3.id, code: "KPI-005",
        name: "ความพึงพอใจประชาชน",
        target: 85, actual: 82, unit: "%", period: "Q2/2569", status: "yellow",
        measurementType: "QUALITATIVE",
        ownerId: commander.id,
      },
    }),
  ]);

  const areas = ["กทม.", "ภาคเหนือ", "ภาคอีสาน", "ภาคใต้"];
  const periods = ["Q1/2569", "Q2/2569"];
  let resultCount = 0;
  for (const kpi of kpis) {
    for (const area of areas) {
      for (const period of periods) {
        await prisma.kpiResult.create({
          data: {
            kpiId: kpi.id,
            area,
            period,
            unitId: regional[Math.floor(Math.random() * regional.length)].id,
            actual: kpi.target * (0.5 + Math.random() * 0.6),
            target: kpi.target,
            reportedById: staff.id,
          },
        });
        resultCount++;
      }
    }
  }

  await prisma.alignmentCheck.create({
    data: {
      targetType: "PLAN_TO_PLAN",
      sourceId: action1.id,
      referenceId: masterSec.id,
      score: 0.87,
      gaps: ["ขาดมาตรการเฉพาะกับยาเสพติดข้ามชาติ"],
      suggestions: ["เพิ่มกิจกรรมร่วมกับ ปปส.", "จัดตั้ง task force ระดับภาค"],
      rationale: "แผนปฏิบัติตอบโจทย์แผนแม่บทในเรื่องการเพิ่มอัตราการจับกุม แต่ขาดมิติข้ามชาติ",
      model: "claude-haiku-4-5",
      tokensUsed: 850,
      elapsedMs: 1200,
      createdById: commander.id,
    },
  });

  console.log(`  ✓ Plans: 6 (1 NAT + 2 MAS + 3 ACT), KPIs: ${kpis.length}, KpiResults: ${resultCount}`);

  // ─────────────────────────────────────────────
  // C. AGENDA & MISSION (TOR 5.4.2)
  // ─────────────────────────────────────────────

  console.log("\n📋 [C] Agenda & Mission");

  const agenda1 = await prisma.agenda.create({
    data: {
      code: "AGD-2569-001",
      title: "ประชุมยุทธศาสตร์รายไตรมาส Q2/2569",
      agendaType: "MEETING",
      scheduledDate: new Date("2026-04-15T09:00:00"),
      ownerId: commander.id,
      unitId: sysor.id,
      status: "scheduled",
    },
  });

  const mission1 = await prisma.mission.create({
    data: {
      code: "MIS-NCB-001",
      title: "ปฏิบัติการเร่งรัดคดียาเสพติด Q2/2569",
      description: "เร่งรัดผลการจับกุม + ตั้งศูนย์อำนวยการ",
      goals: ["เพิ่มจับกุม 30%", "ยึดทรัพย์ 500 ล้าน", "ตัดวงจรเครือข่ายข้ามชาติ"],
      scope: "ครอบคลุมพื้นที่ บช.น. + บช.ภ.1, 5, 7, 9 — ระยะเวลา Q2/2569",
      caseType: "SPECIAL",
      ownerId: commander.id,
      unitId: unitsBelow[2].id,
      planId: action1.id,
      priority: "HIGH",
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-03-31"),
    },
  });

  const mission2 = await prisma.mission.create({
    data: {
      code: "MIS-RTP-001",
      title: "ลดอุบัติเหตุจราจรช่วงเทศกาลสงกรานต์ 2569",
      description: "ตั้งจุดตรวจ + ประชาสัมพันธ์ + กวดขัน",
      goals: ["ลดเสียชีวิต <250 ราย", "ตั้งจุดตรวจ ≥500 จุด"],
      scope: "ทั่วประเทศ ช่วง 11-17 เมษายน 2569",
      caseType: "SPECIAL",
      ownerId: staff.id,
      planId: action2.id,
      agendaId: agenda1.id,
      priority: "URGENT",
      startDate: new Date("2026-04-11"),
      dueDate: new Date("2026-04-17"),
    },
  });

  await Promise.all(
    regional.slice(0, 3).map((u) =>
      prisma.missionTarget.create({
        data: {
          missionId: mission1.id,
          unitId: u.id,
          assignedUserId: staff.id,
          status: "active",
          dueDate: new Date("2026-03-31"),
        },
      })
    )
  );

  await Promise.all([
    prisma.missionKpi.create({ data: { missionId: mission1.id, kpiId: kpis[0].id, weight: 0.6, measurementType: "QUANTITATIVE" } }),
    prisma.missionKpi.create({ data: { missionId: mission1.id, kpiId: kpis[1].id, weight: 0.4, measurementType: "QUANTITATIVE" } }),
    prisma.missionKpi.create({ data: { missionId: mission2.id, kpiId: kpis[2].id, weight: 1.0, measurementType: "QUANTITATIVE" } }),
  ]);

  await prisma.missionEvent.createMany({
    data: [
      { missionId: mission1.id, eventType: "STARTED", title: "เริ่มภารกิจ", occurredAt: new Date("2026-01-01"), createdById: commander.id },
      { missionId: mission1.id, eventType: "MILESTONE", title: "จับกุมเครือข่ายภาคใต้", description: "ยึดเครือข่าย 12 ราย", occurredAt: new Date("2026-02-15"), createdById: staff.id },
    ],
  });

  const formTplData = [
    { name: "รายงานเหตุการณ์ประจำวัน", category: "รายงานเหตุ", frequency: "DAILY" as const },
    { name: "รายงานผลปฏิบัติการรายสัปดาห์", category: "รายงานผล", frequency: "WEEKLY" as const },
    { name: "รายงานสถิติคดีประจำเดือน", category: "รายงานสถิติ", frequency: "MONTHLY" as const },
    { name: "รายงานความก้าวหน้าภารกิจ", category: "รายงานความก้าวหน้า", frequency: "WEEKLY" as const },
    { name: "รายงานการใช้ทรัพยากร", category: "รายงานทรัพยากร", frequency: "MONTHLY" as const },
    { name: "รายงานเหตุฉุกเฉิน", category: "รายงานเหตุ", frequency: "DAILY" as const },
    { name: "รายงานผลการอบรม", category: "รายงานอบรม", frequency: "QUARTERLY" as const },
    { name: "รายงานความพึงพอใจประชาชน", category: "รายงานบริการ", frequency: "QUARTERLY" as const },
    { name: "รายงานผลการจับกุม", category: "รายงานผล", frequency: "DAILY" as const },
    { name: "รายงานการตรวจตราพื้นที่", category: "รายงานเหตุ", frequency: "DAILY" as const },
  ];

  const formTemplates = [];
  for (const t of formTplData) {
    const tpl = await prisma.formTemplate.create({
      data: {
        name: t.name,
        description: `แบบฟอร์มมาตรฐาน — ${t.name}`,
        schema: { fields: ["title", "date", "summary"] },
        category: t.category,
        frequency: t.frequency,
        dimensions: ["พื้นที่", "ช่วงเวลา"],
        isSystem: true,
        createdById: admin.id,
      },
    });
    formTemplates.push(tpl);

    await prisma.formField.createMany({
      data: [
        { templateId: tpl.id, order: 0, label: "หัวเรื่อง", fieldType: "TEXT", required: true },
        { templateId: tpl.id, order: 1, label: "วันที่", fieldType: "DATE", required: true },
        { templateId: tpl.id, order: 2, label: "รายละเอียด", fieldType: "TEXTAREA", required: false },
      ],
    });
  }

  console.log(`  ✓ Agenda: 1, Mission: 2, FormTemplate: ${formTemplates.length}`);

  // ─────────────────────────────────────────────
  // D. COMMAND & WORKFLOW (TOR 5.4.4)
  // ─────────────────────────────────────────────

  console.log("\n📜 [D] Command & Workflow");

  const cmdTplEmergency = await prisma.commandTemplate.create({
    data: {
      code: "TPL-EMRG-001",
      name: "หนังสือสั่งการเหตุฉุกเฉิน",
      caseType: "EMERGENCY",
      body: "ตามที่เกิดเหตุ {{event}} ในพื้นที่ {{location}} จึงสั่งการให้ {{recipient}} ดำเนินการ {{action}} โดยเร่งด่วน",
      isSystem: true,
      createdById: admin.id,
    },
  });

  const cmd1 = await prisma.command.create({
    data: {
      docNo: "ตร.0001/2569",
      subject: "เร่งรัดการดำเนินคดียาเสพติด ไตรมาส 2",
      recipient: "ผบช.มค., ผบช.ภ.9, ผกก.สน. ทุกสน.",
      reference: "หนังสือ ตร.ที่ 4500/2568 ลงวันที่ 1 ตุลาคม 2568",
      objective: "ลดสถิติการแพร่ระบาดและจับกุมเครือข่ายหลัก",
      body: "ตามที่ ผบ.ตร. กำหนดเป็นนโยบายเร่งด่วน...\n\nจึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป",
      signature: "พล.ต.อ. ทดสอบ ผู้บัญชาการ",
      status: "PUBLISHED",
      priority: "URGENT",
      caseType: "SPECIAL",
      missionId: mission1.id,
      creatorId: commander.id,
      signerId: commander.id,
      aiAssisted: true,
      effectiveDate: new Date("2026-01-01"),
      dueDate: new Date("2026-03-31"),
      publishedAt: new Date("2026-01-02"),
    },
  });

  const cmd2 = await prisma.command.create({
    data: {
      docNo: "ตร.0002/2569",
      subject: "ตั้งจุดตรวจสงกรานต์ 2569",
      recipient: "ผบช.ทุกหน่วย",
      objective: "ลดอุบัติเหตุช่วงเทศกาล",
      body: "ตามที่กำหนดเทศกาลสงกรานต์ 2569 จึงสั่งการให้ตั้งจุดตรวจ...",
      status: "APPROVED",
      priority: "HIGH",
      caseType: "SPECIAL",
      missionId: mission2.id,
      agendaId: agenda1.id,
      creatorId: staff.id,
      signerId: commander.id,
      aiAssisted: true,
      templateId: cmdTplEmergency.id,
    },
  });

  await prisma.command.create({
    data: {
      docNo: "ตร.0003/2569",
      subject: "กวดขันการก่อเหตุในพื้นที่เสี่ยง",
      recipient: "ผบช.น., ผบช.ภ.1",
      body: "กวดขันพื้นที่เสี่ยงตามรายงาน Predictive Analytics...",
      status: "DRAFT",
      priority: "NORMAL",
      caseType: "ROUTINE",
      creatorId: staff.id,
    },
  });

  // Sub-command (chain of command) — TOR 4.4 "คำสั่งย่อย"
  await prisma.command.create({
    data: {
      docNo: "ตร.0004/2569",
      subject: "ปฏิบัติการเร่งรัดคดียาเสพติด (สน. ภาคใต้)",
      recipient: "ผกก.สน. ทุกสน. ในเขต บช.ภ.9",
      reference: cmd1.docNo,
      body: "ตามคำสั่ง ตร.0001/2569 ขอให้ดำเนินการในพื้นที่ภาคใต้ทันที...",
      status: "PUBLISHED",
      priority: "URGENT",
      caseType: "SPECIAL",
      missionId: mission1.id,
      parentCommandId: cmd1.id,
      creatorId: commander.id,
      aiAssisted: false,
    },
  });

  // Emergency command (with bypass reason) — TOR 4.7
  const cmdEmergency = await prisma.command.create({
    data: {
      docNo: "ตร.0005/2569",
      subject: "ระงับเหตุปะทะ — ภายใน 30 นาที",
      recipient: "ผบช.น., สน. พื้นที่",
      body: "เกิดเหตุประท้วงรุนแรง ขอให้ส่งกำลังเสริมและระงับเหตุภายใน 30 นาที",
      status: "PUBLISHED",
      priority: "CRITICAL",
      caseType: "EMERGENCY",
      emergencyMode: true,
      emergencyReason: "เหตุประท้วงรุนแรงระดับ CRITICAL จากระบบ 191 — bypass การอนุมัติปกติเพื่อตอบสนองภายใน 30 นาที",
      creatorId: commander.id,
      signerId: commander.id,
    },
  });

  for (const u of regional.slice(0, 3)) {
    const t = await prisma.commandTarget.create({
      data: {
        commandId: cmd1.id,
        unitId: u.id,
        assignedUserId: staff.id,
        acknowledged: Math.random() > 0.3,
        acknowledgedAt: Math.random() > 0.3 ? new Date() : null,
      },
    });
    await prisma.commandTargetKpi.create({
      data: { commandTargetId: t.id, kpiId: kpis[0].id, targetValue: 10 },
    });
  }

  await prisma.commandStatusLog.createMany({
    data: [
      { commandId: cmd1.id, from: null, to: "DRAFT", byUserId: commander.id, note: "ร่างเริ่ม" },
      { commandId: cmd1.id, from: "DRAFT", to: "SUBMITTED", byUserId: commander.id },
      { commandId: cmd1.id, from: "SUBMITTED", to: "APPROVED", byUserId: commander.id },
      { commandId: cmd1.id, from: "APPROVED", to: "PUBLISHED", byUserId: commander.id },
    ],
  });

  await prisma.digitalSignature.create({
    data: {
      commandId: cmd1.id,
      signerId: commander.id,
      signatureType: "E_SIGN",
      signatureData: "base64-mock-signature-data",
      certificateRef: "TDID-CERT-2026-001",
      ipAddress: "10.0.0.1",
    },
  });

  await prisma.commandComment.createMany({
    data: [
      { commandId: cmd2.id, authorId: commander.id, commentType: "REVIEW", body: "เนื้อหาดี ขอเสริมเรื่องประชาสัมพันธ์" },
      { commandId: cmd2.id, authorId: staff.id, commentType: "REVISE", body: "เพิ่มประชาสัมพันธ์ผ่าน LINE OA แล้ว" },
      { commandId: cmd2.id, authorId: commander.id, commentType: "APPROVE", body: "อนุมัติให้เผยแพร่" },
    ],
  });

  const esRule = await prisma.escalationRule.create({
    data: {
      name: "Escalate ถ้าไม่รับทราบใน 24 ชม.",
      triggerOn: "NO_ACK",
      appliesTo: "COMMAND",
      afterMinutes: 1440,
      toRoleId: roles[1].id,
      toUnitParent: true,
    },
  });
  await prisma.escalationLog.create({
    data: {
      ruleId: esRule.id,
      commandId: cmd1.id,
      notifiedUserId: commander.id,
      resolved: false,
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: staff.id, commandId: cmd1.id, channel: "IN_APP", subject: "คำสั่งใหม่: เร่งรัดคดียาเสพติด", body: "โปรดยืนยันการรับทราบ", priority: "URGENT", status: "DELIVERED" },
      { userId: staff.id, commandId: cmd2.id, channel: "EMAIL", subject: "อนุมัติแล้ว: ตั้งจุดตรวจสงกรานต์", body: "พร้อมเผยแพร่", priority: "HIGH", status: "SENT" },
    ],
  });

  console.log(`  ✓ Commands: 3, CommandTemplate: 1, EscalationRule: 1, DigitalSignature: 1`);

  // ─────────────────────────────────────────────
  // E. COMPLIANCE (TOR 5.4.3)
  // ─────────────────────────────────────────────

  console.log("\n📑 [E] Compliance");

  const pmqaTpl = await prisma.complianceTemplate.create({
    data: { standard: "PMQA", code: "PMQA-2569", name: "PMQA ปี 2569", version: "1.0", effectiveDate: new Date("2025-10-01") },
  });
  await prisma.complianceTemplate.create({
    data: { standard: "ITA", code: "ITA-2569", name: "ITA ปี 2569", version: "1.0", effectiveDate: new Date("2025-10-01") },
  });

  const pmqaItems = await Promise.all(
    [
      ["PMQA-1.1", "หมวด 1: การนำองค์กร", "ผู้บริหารกำหนดวิสัยทัศน์ชัดเจน"],
      ["PMQA-2.1", "หมวด 2: การวางแผนเชิงยุทธศาสตร์", "แผนยุทธศาสตร์เชื่อมโยงนโยบาย"],
      ["PMQA-3.1", "หมวด 3: การให้บริการ", "ระดับความพึงพอใจประชาชน ≥ 85%"],
      ["PMQA-4.1", "หมวด 4: การวัด", "มีระบบ KPI ติดตามต่อเนื่อง"],
      ["PMQA-5.1", "หมวด 5: บุคลากร", "พัฒนาบุคลากรต่อเนื่อง"],
      ["PMQA-6.1", "หมวด 6: กระบวนการ", "ลด process ที่ไม่เพิ่มมูลค่า"],
    ].map(([code, category, q]) =>
      prisma.complianceChecklistItem.create({
        data: { templateId: pmqaTpl.id, code, category, question: q, weight: 10, evidenceRequired: true },
      })
    )
  );

  const report = await prisma.complianceReport.create({
    data: {
      templateId: pmqaTpl.id,
      unitId: sysor.id,
      period: "Q4/2568",
      status: "SUBMITTED",
      score: 78.5, maxScore: 100,
      createdById: admin.id,
      submittedAt: new Date(),
    },
  });

  for (const item of pmqaItems) {
    await prisma.complianceAnswer.create({
      data: {
        reportId: report.id,
        itemId: item.id,
        answer: "ผ่านเกณฑ์ — ดู เอกสารแนบ",
        selfScore: 7 + Math.random() * 3,
        answeredById: staff.id,
        answeredAt: new Date(),
      },
    });
  }

  await prisma.complianceScoreLog.create({
    data: { reportId: report.id, version: 1, score: 78.5, changedById: admin.id, note: "self-assessment ครั้งแรก" },
  });

  console.log(`  ✓ Templates: 2, ChecklistItems: ${pmqaItems.length}, Report: 1`);

  // ─────────────────────────────────────────────
  // F. DATA & AI (TOR 5.4.6)
  // ─────────────────────────────────────────────

  console.log("\n🤖 [F] Data & AI");

  const externalSystems = await Promise.all([
    prisma.externalSystem.create({ data: { code: "EMRG_191", name: "ศูนย์รับแจ้งเหตุ 191", systemType: "EMERGENCY_191", baseUrl: "https://api.191.go.th" } }),
    prisma.externalSystem.create({ data: { code: "CCTV_BMA", name: "ระบบกล้องวงจรปิด กทม.", systemType: "CCTV", baseUrl: "https://cctv.bma.go.th" } }),
    prisma.externalSystem.create({ data: { code: "INTEL_NSC", name: "ระบบข่าวกรอง", systemType: "INTEL" } }),
    prisma.externalSystem.create({ data: { code: "SIGN_TDID", name: "TDID e-Signature", systemType: "SIGN_TDID", baseUrl: "https://www.tdid.or.th" } }),
  ]);

  const aiPrompts = await Promise.all([
    prisma.aiPromptTemplate.create({ data: { code: "command_draft", purpose: "COMMAND_DRAFT", systemPrompt: "คุณคือผู้ช่วยร่างหนังสือราชการของ ตร...", modelHint: "claude-sonnet-4-6", version: 1, active: true, createdById: admin.id } }),
    prisma.aiPromptTemplate.create({ data: { code: "doc_classify", purpose: "DOC_CLASSIFY", systemPrompt: "คุณคือ classifier เอกสาร 6 หมวด...", modelHint: "claude-haiku-4-5", version: 1, active: true, createdById: admin.id } }),
    prisma.aiPromptTemplate.create({ data: { code: "alignment", purpose: "ALIGNMENT", systemPrompt: "วิเคราะห์ความสอดคล้องระหว่างแผน...", modelHint: "claude-haiku-4-5", version: 1, active: true, createdById: admin.id } }),
    prisma.aiPromptTemplate.create({ data: { code: "exec_summary", purpose: "EXEC_SUMMARY", systemPrompt: "สรุปสถานการณ์เชิงผู้บริหาร...", version: 1, active: true, createdById: admin.id } }),
    prisma.aiPromptTemplate.create({ data: { code: "semantic_search", purpose: "SEMANTIC_SEARCH", systemPrompt: "ประมวล query เป็น embedding...", version: 1, active: true, createdById: admin.id } }),
  ]);

  await prisma.aiEvaluation.create({
    data: {
      purpose: "DOC_CLASSIFY",
      evalSetName: "PoC-2-sample-16",
      totalCases: 16,
      correctCases: 15,
      accuracy: 0.9375,
      metric: "ACCURACY",
      metricValue: 0.9375,
      modelUsed: "claude-haiku-4-5",
      promptTemplateId: aiPrompts[1].id,
      evaluatedById: admin.id,
    },
  });
  await prisma.aiEvaluation.create({
    data: {
      purpose: "OCR_BASELINE",
      evalSetName: "PoC-3-PDF-6",
      totalCases: 6,
      correctCases: 6,
      accuracy: 0.986,
      metric: "CER",
      metricValue: 1.4,
      modelUsed: "claude-sonnet-4-6",
      evaluatedById: admin.id,
    },
  });

  await prisma.savedDashboard.createMany({
    data: [
      { dashboardType: "MISSION_PROGRESS", name: "ความก้าวหน้าภารกิจ", config: { layout: "grid", widgets: ["mission-list", "kpi-summary"] }, isDefault: true },
      { dashboardType: "RISK_AREA", name: "พื้นที่/ช่วงเวลาเสี่ยง", config: { layout: "map", widgets: ["heatmap", "prediction-list"] }, isDefault: true },
      { dashboardType: "EMERGENCY", name: "เหตุฉุกเฉินและการตอบสนอง", config: { layout: "split", widgets: ["incident-feed", "response-time"] }, isDefault: true },
      { dashboardType: "RESOURCE", name: "การใช้ทรัพยากร", config: { layout: "table", widgets: ["asset-utilization", "allocation-summary"] }, isDefault: true },
      { dashboardType: "PERFORMANCE", name: "ประสิทธิภาพ/ประเมินผลตัวบุคคล", config: { layout: "leaderboard", widgets: ["top-performers", "kpi-by-officer"] }, isDefault: true },
    ],
  });

  const predModel = await prisma.predictiveModel.create({
    data: { name: "Crime Risk Predictor", modelType: "RISK_AREA", version: "1.0", accuracy: 0.78, trainedAt: new Date(), active: true },
  });
  await prisma.predictionResult.createMany({
    data: areas.map((area) => ({
      modelId: predModel.id,
      inputContext: { area, period: "Q2/2569" },
      output: { riskLevel: Math.random() > 0.5 ? "HIGH" : "MEDIUM", incidentCount: Math.floor(Math.random() * 50) + 10 },
      confidence: 0.7 + Math.random() * 0.2,
      targetArea: area,
      targetPeriod: "Q2/2569",
      validUntil: new Date("2026-04-01"),
    })),
  });

  console.log(`  ✓ ExternalSystems: ${externalSystems.length}, AiPrompts: ${aiPrompts.length}, Dashboards: 5`);

  // ─────────────────────────────────────────────
  // G. OPS INTELLIGENCE
  // ─────────────────────────────────────────────

  console.log("\n🔍 [G] Ops Intelligence");

  await prisma.executiveSummary.create({
    data: {
      period: "Q2/2569",
      scope: "NATIONAL",
      title: "สรุปสถานการณ์ Q2/2569 — ระดับชาติ",
      summaryText: "ภาพรวม: ภารกิจหลัก 5 ภารกิจดำเนินไปตามแผน 60% ความท้าทาย: KPI-004 เรื่องเวลาบริการประชาชนยังต่ำกว่าเป้า...",
      keyMetrics: { missionsActive: 5, missionsOnTrack: 3, kpiGreen: 1, kpiYellow: 3, kpiRed: 1 },
      concerns: ["KPI-004 ต่ำกว่าเป้า", "อุบัติเหตุภาคเหนือเพิ่ม 8%"],
      recommendations: ["เพิ่มอบรมบุคลากรหน้างาน", "ตั้งจุดตรวจเพิ่มในเส้นทางเสี่ยง"],
      model: "claude-sonnet-4-6",
      tokensUsed: 1850,
      generatedById: commander.id,
    },
  });

  await prisma.situationReport.create({
    data: {
      reportNo: "SITREP-2026-0001",
      frequency: "DAILY",
      reportDate: new Date(),
      unitId: sysor.id,
      status: "submitted",
      summary: "เหตุการณ์สำคัญในรอบ 24 ชม. — ไม่มีเหตุระดับรุนแรง",
      keyEvents: [{ time: "10:30", event: "การจับกุมยาเสพติด 5 ราย", location: "ภาคใต้" }],
      metrics: { totalIncidents: 12, responseTime: 8.5, resolved: 10 },
      attachments: [],
      createdById: staff.id,
    },
  });

  await prisma.anomalyAlert.create({
    data: {
      anomalyType: "UNUSUAL_PATTERN",
      severity: "MEDIUM",
      referenceType: "incident",
      referenceId: "spike-area-bma-2026-q2",
      description: "พื้นที่ บช.น. มี incident เพิ่ม 35% เทียบสัปดาห์ก่อน",
    },
  });

  console.log("  ✓ ExecutiveSummary: 1, SITREP: 1, AnomalyAlert: 1");

  // ─────────────────────────────────────────────
  // H. RESOURCE & PERFORMANCE
  // ─────────────────────────────────────────────

  console.log("\n🚓 [H] Resource & Performance");

  const assets = await Promise.all([
    prisma.resourceAsset.create({ data: { code: "VEH-001", name: "รถสายตรวจ 1", assetType: "VEHICLE", ownerUnitId: regional[0].id, status: "IN_USE" } }),
    prisma.resourceAsset.create({ data: { code: "VEH-002", name: "รถสายตรวจ 2", assetType: "VEHICLE", ownerUnitId: regional[1].id, status: "AVAILABLE" } }),
    prisma.resourceAsset.create({ data: { code: "EQU-001", name: "เครื่องตรวจวัดแอลกอฮอล์", assetType: "EQUIPMENT", ownerUnitId: regional[0].id, status: "AVAILABLE" } }),
  ]);

  await prisma.resourceAllocation.create({
    data: { assetId: assets[0].id, missionId: mission1.id, assignedToUserId: staff.id, assignedToUnitId: regional[0].id, status: "active" },
  });

  console.log(`  ✓ Assets: ${assets.length}, Allocation: 1`);

  // ─────────────────────────────────────────────
  // I. INCIDENT + AUDIT
  // ─────────────────────────────────────────────

  console.log("\n🚨 [I] Incident");

  // Incident #3 links to emergency command (cross-system 6→4)
  const incident3 = await prisma.incident.create({
    data: { code: "INC-2026-0003", type: "ประท้วง", title: "การชุมนุมหน้าสภา", lat: 13.768, lng: 100.514, location: "เขตดุสิต กทม.", severity: 6, status: "investigating", occurredAt: new Date("2026-04-15T10:00:00"), assignedUnitId: regional[1].id, commandId: cmdEmergency.id, externalSystemId: externalSystems[0].id },
  });

  await prisma.incident.createMany({
    data: [
      { code: "INC-2026-0001", type: "อาชญากรรม", title: "ปล้นทรัพย์ห้างค้าทอง", lat: 13.756, lng: 100.501, location: "เขตปทุมวัน กทม.", severity: 7, status: "investigating", occurredAt: new Date("2026-04-01T14:30:00"), assignedUnitId: regional[1].id, externalSystemId: externalSystems[0].id },
      { code: "INC-2026-0002", type: "อุบัติเหตุ", title: "อุบัติเหตุรถพ่วง", lat: 14.5, lng: 100.5, location: "ทางหลวง 1 อยุธยา", severity: 5, status: "closed", occurredAt: new Date("2026-04-02T09:15:00"), assignedUnitId: regional[2].id, respondedById: staff.id, respondedAt: new Date("2026-04-02T09:30:00"), closedAt: new Date("2026-04-02T11:00:00"), missionId: mission1.id },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: commander.id, action: "auth.login", target: `user:${commander.id}`, ip: "10.0.0.1" },
      { userId: commander.id, action: "command.publish", target: `command:${cmd1.id}` },
      { userId: staff.id, action: "compliance.submit", target: `report:${report.id}` },
    ],
  });

  // ─────────────────────────────────────────────
  // J. Cross-system demos — Attachments + FormSubmission link + AAR
  // ─────────────────────────────────────────────

  console.log("\n🔗 [J] Cross-system links");

  // Sample document for attachments
  const evidenceDoc = await prisma.document.create({
    data: {
      filename: "evidence-2569-001.pdf",
      originalName: "หลักฐานคดี.pdf",
      mimeType: "application/pdf",
      size: 102400,
      storagePath: "demo:evidence-1",
      documentType: "EVIDENCE",
      visibility: "RESTRICTED",
      uploadedById: staff.id,
    },
  });

  // MissionAttachment — เอกสารหลักฐานของภารกิจ (TOR 2.1.2 + 6.6)
  await prisma.missionAttachment.create({
    data: { missionId: mission1.id, documentId: evidenceDoc.id, description: "แผนปฏิบัติการ Q2/2569" },
  });

  // IncidentAttachment — CCTV clip ของเหตุการณ์ (TOR 6.4)
  await prisma.incidentAttachment.create({
    data: { incidentId: incident3.id, documentId: evidenceDoc.id, category: "CCTV", description: "ภาพจาก CCTV ขณะเกิดเหตุ" },
  });

  // FormSubmission linked to Mission (TOR 2.3 reporting against work item)
  await prisma.formSubmission.create({
    data: {
      templateId: formTemplates[0].id,
      data: { title: "รายงานความก้าวหน้า MIS-NCB-001", summary: "จับกุม 8 ราย สัปดาห์นี้" },
      unitId: regional[0].id,
      missionId: mission1.id,
      status: "SUBMITTED",
      submittedById: staff.id,
    },
  });

  // AAR for the emergency Command (TOR 6.6 + 4.x)
  await prisma.afterActionReview.create({
    data: {
      commandId: cmdEmergency.id,
      incidentId: incident3.id,
      reviewDate: new Date("2026-04-20"),
      whatWorked: "ตอบสนองภายใน 25 นาที — เร็วกว่าเป้าหมาย 30 นาที",
      whatDidNot: "การประสานงานกับ บก.จร. ล่าช้า เพราะใช้ช่อง phone อย่างเดียว",
      lessonsLearned: "ใช้ Smart Notification ช่อง LINE OA สำหรับเหตุการณ์ระดับ CRITICAL",
      recommendations: ["ฝึกซ้อมโหมดฉุกเฉินรายไตรมาส", "เพิ่ม MFA สำหรับการ bypass approval"],
      participants: [commander.id, staff.id],
      facilitatorId: commander.id,
    },
  });

  console.log("  ✓ Cross-system: 1 MissionAttachment + 1 IncidentAttachment + 1 FormSubmission + 1 AAR");
  console.log("  ✓ Incidents: 3, AuditLog: 3");

  console.log("\n✅ Seed v3.1 completed successfully!");
  console.log("Demo credentials: commander@eop.test / demo1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
