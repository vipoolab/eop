// Add MFA + lockout + password mgmt columns to User (TOR ๗.๑.๒ + ๗.๑.๖)
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const stmts = [
  `ALTER TABLE "User"
     ADD COLUMN IF NOT EXISTS "mfaRecoveryCodes"   TEXT[] NOT NULL DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS "mfaEnabledAt"       TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "passwordChangedAt"  TIMESTAMP(3),
     ADD COLUMN IF NOT EXISTS "failedLoginCount"   INTEGER NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "lockedUntil"        TIMESTAMP(3)`,
];

try {
  for (const sql of stmts) await prisma.$executeRawUnsafe(sql);
  console.log("✓ Security columns added to User");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
await prisma.$disconnect();
