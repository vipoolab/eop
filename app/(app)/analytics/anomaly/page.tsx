// /analytics/anomaly — Anomaly Alerts (TOR 6.2)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { AcknowledgeButton } from "./acknowledge-button";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

const SEVERITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  CRITICAL: "bg-rose-100 text-rose-700 border-rose-300",
} as const;

const ANOMALY_LABEL: Record<string, string> = {
  UNUSUAL_PATTERN: "รูปแบบผิดปกติ",
  THRESHOLD_BREACH: "เกินค่ามาตรฐาน",
  OUTLIER: "ค่ากระจัดกระจาย",
};

export default async function AnomalyListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/");

  const alerts = await prisma.anomalyAlert.findMany({
    orderBy: [{ resolved: "asc" }, { severity: "desc" }, { detectedAt: "desc" }],
    take: 100,
    include: {
      acknowledgedBy: { select: { name: true, rank: true } },
    },
  });

  const stats = {
    open: alerts.filter((a) => !a.resolved).length,
    critical: alerts.filter((a) => !a.resolved && a.severity === "CRITICAL").length,
    high: alerts.filter((a) => !a.resolved && a.severity === "HIGH").length,
    resolved: alerts.filter((a) => a.resolved).length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/analytics"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังวิเคราะห์ + พยากรณ์
      </Link>

      <PageHeader
        icon={AlertTriangle}
        eyebrow="Analytics · Anomaly"
        title="Anomaly Alerts"
        description="ความผิดปกติของระบบและข้อมูลที่ตรวจพบ — TOR 6.2"
      />

      <div className="grid grid-cols-4 gap-3">
        <Stat label="เปิดอยู่" value={stats.open} accent="amber" />
        <Stat label="ขั้น Critical" value={stats.critical} accent="rose" />
        <Stat label="ขั้น High" value={stats.high} accent="orange" />
        <Stat label="แก้ไขแล้ว" value={stats.resolved} accent="emerald" />
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <ShieldAlert className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">ไม่มี Alert ใดๆ — ระบบทำงานปกติ ✓</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border-2 ${a.resolved ? "border-slate-200 bg-slate-50/50 opacity-70" : "border-slate-200 bg-white"} p-4`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${a.resolved ? "bg-emerald-100 text-emerald-700" : SEVERITY_COLORS[a.severity as keyof typeof SEVERITY_COLORS]}`}
                >
                  {a.resolved ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${SEVERITY_COLORS[a.severity as keyof typeof SEVERITY_COLORS]}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ANOMALY_LABEL[a.anomalyType] ?? a.anomalyType}
                    </span>
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(a.detectedAt).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {a.referenceType}:{a.referenceId.slice(0, 8)}…
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {a.description}
                  </p>
                  {a.acknowledgedBy && (
                    <div className="text-[11px] text-emerald-700 mt-1">
                      ✓ รับทราบโดย {a.acknowledgedBy.rank ?? ""} {a.acknowledgedBy.name}{" "}
                      {a.acknowledgedAt &&
                        `เมื่อ ${new Date(a.acknowledgedAt).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}`}
                    </div>
                  )}
                </div>

                {!a.resolved && ["ADMIN", "COMMANDER", "AUDITOR"].includes(role) && (
                  <AcknowledgeButton alertId={a.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STAT_COLORS = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
} as const;

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: keyof typeof STAT_COLORS;
}) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[accent]} p-3`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
