// Add e-Sign / Approver columns to ComplianceReport (TOR ๓.๑ ผบ.หน่วยลงนาม)
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const stmts = [
  `ALTER TABLE "ComplianceReport"
     ADD COLUMN IF NOT EXISTS "approverId"        TEXT,
     ADD COLUMN IF NOT EXISTS "approvedAt"        TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "approverSignature" TEXT,
     ADD COLUMN IF NOT EXISTS "signatureCertRef"  TEXT,
     ADD COLUMN IF NOT EXISTS "signatureIp"       TEXT,
     ADD COLUMN IF NOT EXISTS "signatureUa"       TEXT`,

  `DO $$ BEGIN
     ALTER TABLE "ComplianceReport"
       ADD CONSTRAINT "ComplianceReport_approverId_fkey"
       FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `CREATE INDEX IF NOT EXISTS "ComplianceReport_approverId_idx" ON "ComplianceReport"("approverId")`,
];

try {
  for (const sql of stmts) await prisma.$executeRawUnsafe(sql);
  console.log("✓ Compliance approver/e-Sign columns added");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
await prisma.$disconnect();
