import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ComplianceAnswer" ADD COLUMN IF NOT EXISTS "assignedUnitId" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ComplianceAnswer_assignedUnitId_idx" ON "ComplianceAnswer"("assignedUnitId")`
  );
  console.log("✓ assignedUnitId column added to ComplianceAnswer");
} catch (e) {
  console.error(e);
}
await prisma.$disconnect();
