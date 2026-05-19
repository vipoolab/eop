import { config } from "dotenv";
config({ override: true });

// Dynamic import AFTER env loaded
async function main() {
  const { prisma } = await import("../lib/prisma");

  const recent = await prisma.auditLog.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, role: true } } },
  });

  console.log(`📋 Recent audit logs (${recent.length}):\n`);
  for (const log of recent) {
    const time = log.createdAt.toLocaleString("th-TH", {
      timeStyle: "medium",
      dateStyle: "short",
    });
    console.log(
      `[${time}] ${log.user?.email ?? "—"} (${log.user?.role ?? "—"})`
    );
    console.log(`   action: ${log.action}`);
    console.log(`   target: ${log.target}`);
    if (log.details) {
      console.log(
        `   details: ${JSON.stringify(log.details).slice(0, 120)}`
      );
    }
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
