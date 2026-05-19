// Command Workflow — Kanban view (TOR 5.4.4, 4.1)
// Server Component: fetches commands grouped by 9 statuses

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type CommandStatus,
  type CommandPriority,
} from "@/features/commands/types";
import { Plus, FileText, Clock, Users, Workflow } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommandWorkflowPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const commands = await prisma.command.findMany({
    include: {
      creator: { select: { name: true, rank: true } },
      targets: { select: { id: true, acknowledged: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by status
  const grouped = STATUS_ORDER.reduce<
    Record<CommandStatus, typeof commands>
  >(
    (acc, status) => {
      acc[status] = commands.filter((c) => c.status === status);
      return acc;
    },
    {} as Record<CommandStatus, typeof commands>
  );

  const totals = {
    total: commands.length,
    active: commands.filter(
      (c) =>
        c.status !== "CLOSED" &&
        c.status !== "DRAFT"
    ).length,
    closed: commands.filter((c) => c.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Workflow}
        eyebrow="Command & Operation"
        title="วงจรคำสั่ง"
        description={`ทั้งหมด ${totals.total} คำสั่ง · กำลังดำเนินการ ${totals.active} · ปิดแล้ว ${totals.closed}`}
        actions={
          <Link
            href="/command/workflow/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            สร้างคำสั่งใหม่
          </Link>
        }
      />

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            return (
              <div
                key={status}
                className="w-72 shrink-0 rounded-xl bg-slate-50 border border-slate-200"
              >
                {/* Column header */}
                <div
                  className={`px-3 py-2 rounded-t-xl border-b ${STATUS_COLORS[status]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-white/70 text-xs font-mono font-semibold">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      ไม่มีรายการ
                    </div>
                  ) : (
                    items.map((cmd) => {
                      const ackCount = cmd.targets.filter(
                        (t) => t.acknowledged
                      ).length;
                      return (
                        <Link
                          key={cmd.id}
                          href={`/command/workflow/${cmd.id}`}
                          className="block rounded-lg bg-white border border-slate-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-[11px] text-slate-500">
                              {cmd.docNo}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                PRIORITY_COLORS[
                                  cmd.priority as CommandPriority
                                ]
                              }`}
                            >
                              {
                                PRIORITY_LABELS[
                                  cmd.priority as CommandPriority
                                ]
                              }
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
                            {cmd.subject}
                          </h3>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {ackCount}/{cmd.targets.length}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(cmd.createdAt).toLocaleDateString(
                                "th-TH",
                                { day: "numeric", month: "short" }
                              )}
                            </div>
                          </div>
                          {cmd.creator && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
                              <FileText className="inline h-3 w-3 mr-1" />
                              {cmd.creator.rank} {cmd.creator.name}
                            </div>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          ลำดับ 9 สถานะของคำสั่ง
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2 text-[11px]">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="font-mono text-slate-400">{i + 1}.</span>
              <span className="text-slate-700">{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
