// /security/logs — Activity Log + Login Attempts + Export CSV (TOR ๗.๑.๕ + ๗.๑.๖)

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ScrollText } from "lucide-react";
import { LogsView } from "./logs-view";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string; user?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "AUDITOR"].includes(role)) redirect("/security");

  const sp = await searchParams;

  const [audit, attempts, actions, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(sp.action ? { action: { contains: sp.action, mode: "insensitive" } } : {}),
        ...(sp.user ? { userId: sp.user } : {}),
        ...(sp.q
          ? {
              OR: [
                { action: { contains: sp.q, mode: "insensitive" } },
                { target: { contains: sp.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, rank: true, email: true } } },
    }),
    prisma.loginAttempt.findMany({
      where: sp.q
        ? {
            OR: [
              { email: { contains: sp.q, mode: "insensitive" } },
              { ipAddress: { contains: sp.q } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog
      .groupBy({ by: ["action"], _count: { action: true }, orderBy: { _count: { action: "desc" } }, take: 30 })
      .then((r) => r.map((x) => ({ action: x.action, count: x._count.action }))),
    prisma.user.findMany({
      select: { id: true, name: true, rank: true, email: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={ScrollText}
        eyebrow="Security · TOR 7.1.5 / 7.1.6"
        title="Activity & Login Logs"
        description="ตรวจสอบกิจกรรม + ความพยายาม login ย้อนหลัง · Export CSV สำหรับ Forensic"
      />

      <LogsView
        initialTab={sp.tab === "attempts" ? "attempts" : "activity"}
        audit={audit.map((a) => ({
          id: a.id,
          action: a.action,
          target: a.target,
          userId: a.userId,
          userName: a.user ? `${a.user.rank ?? ""} ${a.user.name}`.trim() : null,
          userEmail: a.user?.email ?? null,
          ip: a.ip,
          ua: a.ua,
          details: a.details,
          createdAt: a.createdAt.toISOString(),
        }))}
        attempts={attempts.map((l) => ({
          id: l.id,
          email: l.email,
          success: l.success,
          failReason: l.failReason,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          createdAt: l.createdAt.toISOString(),
        }))}
        actions={actions}
        users={users}
        filters={{ action: sp.action ?? "", user: sp.user ?? "", q: sp.q ?? "" }}
      />
    </div>
  );
}
