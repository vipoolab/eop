// Seed sample data for P6 Data & AI menus
// — AnomalyAlert (8 records, mix of severity & resolved status)
// — ExternalSystem (5 records — 191, CCTV, INTEL, WEATHER, TDID)
// — EtlJob + EtlRun (3 jobs)
// — DataQualityRule (4 rules)

import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const adminUser = await prisma.user.findUnique({ where: { email: "admin@eop.test" } });
if (!adminUser) {
  console.error("admin user not found");
  process.exit(1);
}

// ─── Cleanup ─────────────────────────────────────
console.log("Cleanup old demo data...");
await prisma.dataQualityCheck.deleteMany({});
await prisma.dataQualityRule.deleteMany({ where: { name: { startsWith: "DQ-" } } });
await prisma.etlRun.deleteMany({});
await prisma.etlJob.deleteMany({ where: { name: { startsWith: "ETL-" } } });
await prisma.integrationLog.deleteMany({});
await prisma.externalSystem.deleteMany({ where: { code: { startsWith: "EXT-" } } });
await prisma.anomalyAlert.deleteMany({});

// ─── AnomalyAlert ─────────────────────────────────
console.log("Seeding anomaly alerts...");
const now = Date.now();
const anomalies = [
  {
    anomalyType: "THRESHOLD_BREACH",
    severity: "CRITICAL",
    referenceType: "kpi",
    referenceId: "kpi-001",
    description: "KPI 'อัตราการบรรลุภารกิจ' ต่ำกว่าเป้า 50% ติดต่อกัน 3 ไตรมาส",
    detectedAt: new Date(now - 1 * 86400_000),
    resolved: false,
  },
  {
    anomalyType: "UNUSUAL_PATTERN",
    severity: "HIGH",
    referenceType: "incident",
    referenceId: "inc-002",
    description: "เหตุการณ์ในพื้นที่ บก.น.3 เพิ่มขึ้น 240% เทียบสัปดาห์ก่อน",
    detectedAt: new Date(now - 2 * 3600_000),
    resolved: false,
  },
  {
    anomalyType: "OUTLIER",
    severity: "HIGH",
    referenceType: "command",
    referenceId: "cmd-003",
    description: "คำสั่ง 'ตร 0001/0042' ค้างที่ SUBMITTED 96 ชั่วโมง ผิดปกติ",
    detectedAt: new Date(now - 6 * 3600_000),
    resolved: false,
  },
  {
    anomalyType: "THRESHOLD_BREACH",
    severity: "MEDIUM",
    referenceType: "compliance",
    referenceId: "comp-004",
    description: "รายงาน ITA ยังไม่ส่งภายนอกแม้พ้นกำหนดมา 5 วัน",
    detectedAt: new Date(now - 12 * 3600_000),
    resolved: false,
  },
  {
    anomalyType: "UNUSUAL_PATTERN",
    severity: "LOW",
    referenceType: "user",
    referenceId: "user-005",
    description: "Login ผิดปกตินอกเวลาราชการ — admin login 2:30 น.",
    detectedAt: new Date(now - 18 * 3600_000),
    resolved: false,
  },
  {
    anomalyType: "OUTLIER",
    severity: "MEDIUM",
    referenceType: "incident",
    referenceId: "inc-006",
    description: "เหตุการณ์ความรุนแรงพื้นที่ บช.น. สูงกว่าค่าเฉลี่ย 3.2 SD",
    detectedAt: new Date(now - 24 * 3600_000),
    resolved: true,
    acknowledgedById: adminUser.id,
    acknowledgedAt: new Date(now - 20 * 3600_000),
  },
  {
    anomalyType: "THRESHOLD_BREACH",
    severity: "LOW",
    referenceType: "kpi",
    referenceId: "kpi-007",
    description: "KPI ป้องกันยาเสพติด ภ.4 ต่ำกว่าเป้า 5%",
    detectedAt: new Date(now - 36 * 3600_000),
    resolved: true,
    acknowledgedById: adminUser.id,
    acknowledgedAt: new Date(now - 32 * 3600_000),
  },
  {
    anomalyType: "UNUSUAL_PATTERN",
    severity: "MEDIUM",
    referenceType: "etl",
    referenceId: "etl-008",
    description: "ETL Job 'sync-191' ใช้เวลานานขึ้น 4x จากปกติ",
    detectedAt: new Date(now - 48 * 3600_000),
    resolved: true,
    acknowledgedById: adminUser.id,
    acknowledgedAt: new Date(now - 44 * 3600_000),
  },
];
await prisma.anomalyAlert.createMany({ data: anomalies });
console.log(`✓ Anomaly Alerts: ${anomalies.length}`);

// ─── ExternalSystem ─────────────────────────────────
console.log("Seeding external systems...");
const externals = [
  {
    code: "EXT-191",
    name: "ศูนย์รับแจ้งเหตุฉุกเฉิน 191",
    systemType: "EMERGENCY_191",
    baseUrl: "https://api.191.police.go.th/v1",
    authMethod: "OAuth2",
    active: true,
    lastSyncAt: new Date(now - 5 * 60_000),
  },
  {
    code: "EXT-CCTV-BKK",
    name: "กล้องวงจรปิดกรุงเทพมหานคร",
    systemType: "CCTV",
    baseUrl: "https://cctv.bma.go.th/api",
    authMethod: "API Key",
    active: true,
    lastSyncAt: new Date(now - 12 * 60_000),
  },
  {
    code: "EXT-INTEL",
    name: "ระบบข่าวกรองอัจฉริยะ (อช.)",
    systemType: "INTEL",
    baseUrl: "https://intel-internal.police.go.th",
    authMethod: "mTLS",
    active: true,
    lastSyncAt: new Date(now - 2 * 3600_000),
  },
  {
    code: "EXT-WEATHER",
    name: "กรมอุตุนิยมวิทยา",
    systemType: "WEATHER",
    baseUrl: "https://api.tmd.go.th/v2",
    authMethod: "API Key",
    active: true,
    lastSyncAt: new Date(now - 30 * 60_000),
  },
  {
    code: "EXT-TDID",
    name: "TDID Electronic Signature Service",
    systemType: "SIGN_TDID",
    baseUrl: "https://esign.tdid.or.th",
    authMethod: "OAuth2 + Cert",
    active: false,
    lastSyncAt: null,
  },
];
const createdExternals = [];
for (const e of externals) {
  const c = await prisma.externalSystem.create({ data: e });
  createdExternals.push(c);
}
console.log(`✓ External Systems: ${createdExternals.length}`);

// Some integration logs
for (const ext of createdExternals) {
  if (!ext.active) continue;
  await prisma.integrationLog.create({
    data: {
      systemId: ext.id,
      action: "sync",
      direction: "INBOUND",
      responseStatus: 200,
      responseSummary: "OK",
      latencyMs: Math.floor(Math.random() * 200) + 50,
    },
  });
}

// ─── EtlJob + Run ─────────────────────────────────
console.log("Seeding ETL jobs...");
const etl1 = await prisma.etlJob.create({
  data: {
    name: "ETL-Sync-191-Daily",
    sourceType: "API",
    sourceSystemId: createdExternals[0].id,
    destinationTable: "Incident",
    transformRules: { mapping: { "191.event_id": "Incident.externalRef" } },
    schedule: "0 */6 * * *",
    active: true,
    createdById: adminUser.id,
  },
});
await prisma.etlRun.create({
  data: {
    jobId: etl1.id,
    status: "SUCCESS",
    recordsRead: 142,
    recordsWritten: 138,
    recordsFailed: 4,
    startedAt: new Date(now - 30 * 60_000),
    finishedAt: new Date(now - 28 * 60_000),
  },
});

const etl2 = await prisma.etlJob.create({
  data: {
    name: "ETL-Import-KPI-Quarterly",
    sourceType: "EXCEL",
    destinationTable: "KpiResult",
    transformRules: { sheet: "KPI", header: 1 },
    schedule: "0 1 1 */3 *",
    active: true,
    createdById: adminUser.id,
  },
});
await prisma.etlRun.create({
  data: {
    jobId: etl2.id,
    status: "SUCCESS",
    recordsRead: 87,
    recordsWritten: 87,
    recordsFailed: 0,
    startedAt: new Date(now - 6 * 3600_000),
    finishedAt: new Date(now - 6 * 3600_000 + 12_000),
  },
});

const etl3 = await prisma.etlJob.create({
  data: {
    name: "ETL-Import-Personnel-Weekly",
    sourceType: "CSV",
    destinationTable: "User",
    transformRules: { delimiter: "," },
    schedule: "0 2 * * 0",
    active: false,
    createdById: adminUser.id,
  },
});
await prisma.etlRun.create({
  data: {
    jobId: etl3.id,
    status: "FAILED",
    recordsRead: 0,
    recordsWritten: 0,
    recordsFailed: 0,
    startedAt: new Date(now - 24 * 3600_000),
    finishedAt: new Date(now - 24 * 3600_000 + 5_000),
    errorMessage: "Source file not found: /imports/personnel-2569-w20.csv",
  },
});
console.log(`✓ ETL Jobs: 3`);

// ─── DataQualityRule ─────────────────────────────────
console.log("Seeding data quality rules...");
const dq1 = await prisma.dataQualityRule.create({
  data: {
    name: "DQ-User-Email-Required",
    targetTable: "User",
    ruleType: "NOT_NULL",
    ruleExpression: "User.email IS NOT NULL",
    severity: "ERROR",
    active: true,
  },
});
await prisma.dataQualityCheck.create({
  data: {
    ruleId: dq1.id,
    passed: true,
    failureCount: 0,
    checkedAt: new Date(now - 1 * 3600_000),
  },
});

const dq2 = await prisma.dataQualityRule.create({
  data: {
    name: "DQ-Command-DocNo-Unique",
    targetTable: "Command",
    ruleType: "UNIQUE",
    ruleExpression: "Command.docNo unique across all records",
    severity: "ERROR",
    active: true,
  },
});
await prisma.dataQualityCheck.create({
  data: {
    ruleId: dq2.id,
    passed: true,
    failureCount: 0,
    checkedAt: new Date(now - 2 * 3600_000),
  },
});

const dq3 = await prisma.dataQualityRule.create({
  data: {
    name: "DQ-KPI-Target-Positive",
    targetTable: "Kpi",
    ruleType: "RANGE",
    ruleExpression: "Kpi.target > 0",
    severity: "WARNING",
    active: true,
  },
});
await prisma.dataQualityCheck.create({
  data: {
    ruleId: dq3.id,
    passed: false,
    failureCount: 3,
    samples: { ids: ["k1", "k2", "k3"] },
    checkedAt: new Date(now - 30 * 60_000),
  },
});

const dq4 = await prisma.dataQualityRule.create({
  data: {
    name: "DQ-Mission-Code-Format",
    targetTable: "Mission",
    ruleType: "REGEX",
    ruleExpression: "^[A-Z]+-[0-9]+$",
    severity: "WARNING",
    active: true,
  },
});
await prisma.dataQualityCheck.create({
  data: {
    ruleId: dq4.id,
    passed: true,
    failureCount: 0,
    checkedAt: new Date(now - 4 * 3600_000),
  },
});

console.log(`✓ Data Quality Rules: 4 + 4 checks`);

console.log("\n✓ All P6 demo data seeded");
await prisma.$disconnect();
