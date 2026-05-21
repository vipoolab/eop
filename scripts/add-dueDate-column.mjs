import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ComplianceReport" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ComplianceReport_dueDate_status_idx" ON "ComplianceReport"("dueDate", "status")`
  );
  console.log("✓ dueDate column added");
} catch (e) {
  console.error(e);
}
await prisma.$disconnect();
