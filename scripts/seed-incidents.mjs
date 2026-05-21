// Seed sample incidents (TOR ๖.๔)
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Cleanup any prior seed
await prisma.incident.deleteMany({ where: { code: { startsWith: "INC-2569-" } } });

const admin = await prisma.user.findUnique({ where: { email: "admin@eop.test" } });
const commander = await prisma.user.findUnique({ where: { email: "commander@eop.test" } });
const staff = await prisma.user.findUnique({ where: { email: "staff@eop.test" } });
const units = await prisma.unit.findMany({ where: { active: true }, take: 5 });
const ext191 = await prisma.externalSystem.findFirst({ where: { systemType: "EMERGENCY_191" } });
const extCctv = await prisma.externalSystem.findFirst({ where: { systemType: "CCTV" } });
const extIntel = await prisma.externalSystem.findFirst({ where: { systemType: "INTEL" } });

const now = Date.now();

const incidents = [
  // Open
  {
    code: "INC-2569-0001",
    type: "อาชญากรรม",
    title: "เหตุปล้นทรัพย์ร้านทอง ซอย ๑๑ บางรัก",
    description: "รายงานเหตุปล้นทรัพย์โดยกลุ่มชาย 3 คน ใช้อาวุธปืน หลบหนีไปทางทิศตะวันออก",
    location: "บางรัก · กรุงเทพมหานคร",
    severity: 9,
    status: "open",
    externalSystemId: ext191?.id,
    externalRef: "191-2569-99421",
    occurredAt: new Date(now - 10 * 60_000),
    reportedAt: new Date(now - 8 * 60_000),
  },
  {
    code: "INC-2569-0002",
    type: "ประท้วง",
    title: "การชุมนุมหน้าทำเนียบรัฐบาล",
    description: "ผู้ชุมนุมประมาณ 200 คน เรียกร้องประเด็นทางการเมือง สถานการณ์สงบ",
    location: "ดุสิต · กรุงเทพมหานคร",
    severity: 7,
    status: "investigating",
    assignedUnitId: units[0]?.id,
    respondedById: commander?.id,
    respondedAt: new Date(now - 20 * 60_000),
    externalSystemId: ext191?.id,
    externalRef: "191-2569-99405",
    occurredAt: new Date(now - 45 * 60_000),
    reportedAt: new Date(now - 40 * 60_000),
  },
  {
    code: "INC-2569-0003",
    type: "อุบัติเหตุ",
    title: "อุบัติเหตุรถบรรทุก ๑๘ ล้อ ทางหลวง ๓๔",
    description: "รถบรรทุกเสียหลักชนแบริเออร์ มีผู้ได้รับบาดเจ็บ 2 ราย",
    location: "บางพลี · สมุทรปราการ",
    severity: 6,
    status: "investigating",
    assignedUnitId: units[1]?.id,
    respondedById: staff?.id,
    respondedAt: new Date(now - 1.5 * 3600_000),
    externalSystemId: extCctv?.id,
    externalRef: "CCTV-CAM-204-EVENT-991",
    occurredAt: new Date(now - 2 * 3600_000),
    reportedAt: new Date(now - 1.8 * 3600_000),
  },
  {
    code: "INC-2569-0004",
    type: "ข่าวกรอง",
    title: "พบกลุ่มผู้ค้ายาเสพติด พื้นที่ภาคใต้",
    description: "ข่าวสาร พบกลุ่มผู้ต้องสงสัยค้ายาเสพติด เคลื่อนไหวที่จังหวัดสงขลา ขอกำลังเสริม",
    location: "หาดใหญ่ · สงขลา",
    severity: 8,
    status: "investigating",
    assignedUnitId: units[2]?.id,
    respondedById: commander?.id,
    respondedAt: new Date(now - 3 * 3600_000),
    externalSystemId: extIntel?.id,
    externalRef: "INTEL-2569-Q2-001",
    occurredAt: new Date(now - 5 * 3600_000),
    reportedAt: new Date(now - 4 * 3600_000),
  },
  {
    code: "INC-2569-0005",
    type: "ฉุกเฉิน",
    title: "เพลิงไหม้ตึกแถว ตลาดบางขุนเทียน",
    description: "เกิดเหตุเพลิงไหม้ตึกแถว 3 คูหา ดับเพลิงควบคุมเพลิงได้ มีผู้บาดเจ็บเล็กน้อย",
    location: "บางขุนเทียน · กรุงเทพมหานคร",
    severity: 7,
    status: "closed",
    assignedUnitId: units[0]?.id,
    respondedById: staff?.id,
    respondedAt: new Date(now - 8 * 3600_000),
    externalSystemId: ext191?.id,
    externalRef: "191-2569-98801",
    occurredAt: new Date(now - 10 * 3600_000),
    reportedAt: new Date(now - 9.5 * 3600_000),
    closedAt: new Date(now - 6 * 3600_000),
  },
  // Yesterday — closed
  {
    code: "INC-2569-0006",
    type: "อาชญากรรม",
    title: "ลักทรัพย์ในเคหะสถาน ซอยลาดพร้าว ๗๑",
    description: "ขโมยเข้าบ้าน นำของมีค่าหลายรายการไป",
    location: "ห้วยขวาง · กรุงเทพมหานคร",
    severity: 4,
    status: "closed",
    assignedUnitId: units[1]?.id,
    respondedById: staff?.id,
    respondedAt: new Date(now - 22 * 3600_000),
    occurredAt: new Date(now - 26 * 3600_000),
    reportedAt: new Date(now - 24 * 3600_000),
    closedAt: new Date(now - 12 * 3600_000),
  },
];

for (const inc of incidents) {
  if (!inc.assignedUnitId && inc.status !== "open") delete inc.assignedUnitId;
  await prisma.incident.create({ data: inc });

  // Audit log entries
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "incident.create",
      target: `incident:${inc.code}`,
      details: { code: inc.code, type: inc.type, severity: inc.severity },
      createdAt: inc.reportedAt,
    },
  });
  if (inc.assignedUnitId) {
    const u = units.find((x) => x.id === inc.assignedUnitId);
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "incident.assign",
        target: `incident:${inc.code}`,
        details: { unitCode: u?.code, unitName: u?.name },
        createdAt: new Date(inc.reportedAt.getTime() + 2 * 60_000),
      },
    });
  }
  if (inc.respondedAt) {
    await prisma.auditLog.create({
      data: {
        userId: inc.respondedById,
        action: "incident.respond",
        target: `incident:${inc.code}`,
        createdAt: inc.respondedAt,
      },
    });
  }
  if (inc.closedAt) {
    await prisma.auditLog.create({
      data: {
        userId: commander.id,
        action: "incident.close",
        target: `incident:${inc.code}`,
        details: { resolution: "ดำเนินคดี/ปิดเรื่องตามขั้นตอน" },
        createdAt: inc.closedAt,
      },
    });
  }
}

console.log(`✓ Seeded ${incidents.length} incidents`);
await prisma.$disconnect();
