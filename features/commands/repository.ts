// Command Repository — Prisma queries
// Pure data access, no business logic

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export const commandInclude = {
  creator: {
    select: { id: true, name: true, rank: true, email: true },
  },
  signer: {
    select: { id: true, name: true, rank: true },
  },
  targets: {
    include: {
      unit: { select: { id: true, code: true, name: true } },
      assignedUser: { select: { id: true, name: true, rank: true } },
    },
  },
  statusLog: {
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  mission: {
    select: { id: true, code: true, title: true },
  },
} satisfies Prisma.CommandInclude;

export type CommandWithRelations = Prisma.CommandGetPayload<{
  include: typeof commandInclude;
}>;

export async function findCommandById(id: string) {
  return prisma.command.findUnique({
    where: { id },
    include: commandInclude,
  });
}

export async function listCommands(args: {
  where?: Prisma.CommandWhereInput;
  skip?: number;
  take?: number;
  orderBy?: Prisma.CommandOrderByWithRelationInput;
}) {
  const [items, total] = await Promise.all([
    prisma.command.findMany({
      where: args.where,
      include: commandInclude,
      skip: args.skip,
      take: args.take,
      orderBy: args.orderBy ?? { createdAt: "desc" },
    }),
    prisma.command.count({ where: args.where }),
  ]);

  return { items, total };
}

export async function getCommandsByStatus() {
  const grouped = await prisma.command.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count.id;
    return acc;
  }, {});
}

/** Generate next sequential doc number */
export async function getNextDocNo(): Promise<string> {
  const count = await prisma.command.count();
  const num = count + 1;
  const padded = String(num).padStart(4, "0");
  // Thai digits
  const thaiNum = padded
    .split("")
    .map(
      (c) =>
        ({
          "0": "๐",
          "1": "๑",
          "2": "๒",
          "3": "๓",
          "4": "๔",
          "5": "๕",
          "6": "๖",
          "7": "๗",
          "8": "๘",
          "9": "๙",
        })[c] ?? c
    )
    .join("");
  return `ตร ๐๐๐๑.๖๙/${thaiNum}`;
}
