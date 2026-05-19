import { config } from "dotenv";
config({ override: true });

async function main() {
  const { prisma } = await import("../lib/prisma");
  const users = await prisma.user.findMany({
    select: { email: true, name: true, rank: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log("Users in DB:");
  for (const u of users) {
    console.log(`  ${u.email.padEnd(25)} | rank: ${u.rank ?? "—"} | name: ${u.name}`);
  }
  await prisma.$disconnect();
}
main();
