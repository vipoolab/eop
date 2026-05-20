// KPI Cascading

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { TrendingUp, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_META = {
  green: {
    label: "บรรลุเป้าหมาย",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  yellow: {
    label: "ใกล้เคียงเป้าหมาย",
    icon: AlertCircle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  red: {
    label: "ต่ำกว่าเป้าหมาย",
    icon: XCircle,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
  },
} as const;

export default async function KpiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const kpis = await prisma.kpi.findMany({
    include: { plan: { select: { code: true, title: true } } },
    orderBy: { code: "asc" },
  });

  const byStatus = {
    green: kpis.filter((k) => k.status === "green").length,
    yellow: kpis.filter((k) => k.status === "yellow").length,
    red: kpis.filter((k) => k.status === "red").length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={TrendingUp}
        eyebrow="Strategic Planning"
        title="KPI Cascading — ตัวชี้วัดถ่ายทอด"
        description={`ตัวชี้วัดความสำเร็จ ${kpis.length} รายการ — ถ่ายทอดจากแผนปฏิบัติราชการลงสู่หน่วยงาน`}
      />

      <div className="grid grid-cols-3 gap-3">
        {(["green", "yellow", "red"] as const).map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          return (
            <div
              key={s}
              className={`rounded-sm border ${meta.border} ${meta.bg} p-4`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`h-5 w-5 ${meta.color}`} />
                <span
                  className={`text-2xl font-semibold tabular-nums ${meta.color}`}
                >
                  {byStatus[s]}
                </span>
              </div>
              <div
                className={`text-[11px] font-semibold uppercase tracking-wider ${meta.color}`}
              >
                {meta.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {kpis.map((k) => {
          const status = (k.status ?? "yellow") as keyof typeof STATUS_META;
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const pct =
            k.target && k.actual
              ? Math.min(100, Math.round((k.actual / k.target) * 100))
              : 0;
          return (
            <div
              key={k.id}
              className="rounded-sm border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-500">
                      {k.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${meta.bg} ${meta.color} border ${meta.border}`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {k.period}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">
                    {k.name}
                  </h3>
                  {k.description && (
                    <p className="text-xs text-slate-600">{k.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {k.actual?.toFixed(1) ?? "—"}
                    <span className="text-sm text-slate-500 ml-0.5">
                      {k.unit}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    ผลจริง · เป้า {k.target?.toFixed(1)} {k.unit}
                  </div>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${meta.bar} transition-all rounded-sm`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-[10px] text-slate-500">
                  จากแผน: {k.plan.code}
                </div>
                <div
                  className={`text-[10px] font-semibold ${meta.color} tabular-nums`}
                >
                  {pct}% ของเป้า
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
