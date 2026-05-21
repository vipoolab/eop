// Incident Management — Real DB integration (TOR ๖.๔)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  AlertOctagon,
  MapPin,
  Clock,
  Phone,
  Video,
  Eye,
  Activity,
  PlusCircle,
  ArrowRight,
  Building2,
  UserCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

const TYPE_COLOR: Record<string, string> = {
  ประท้วง: "bg-amber-50 text-amber-700 border-amber-200",
  อาชญากรรม: "bg-rose-50 text-rose-700 border-rose-200",
  อุบัติเหตุ: "bg-blue-50 text-blue-700 border-blue-200",
  ข่าวกรอง: "bg-violet-50 text-violet-700 border-violet-200",
  ฉุกเฉิน: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "เปิดใหม่",
  investigating: "กำลังดำเนินการ",
  closed: "ปิดคดี",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-rose-100 text-rose-700 border-rose-200",
  investigating: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function severityColor(s: number): string {
  if (s >= 8) return "bg-rose-500";
  if (s >= 6) return "bg-amber-500";
  if (s >= 4) return "bg-blue-500";
  return "bg-slate-400";
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} นาทีก่อน`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงก่อน`;
  const days = Math.floor(h / 24);
  return `${days} วันก่อน`;
}

export default async function IncidentListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;

  const incidents = await prisma.incident.findMany({
    orderBy: { reportedAt: "desc" },
    take: 100,
    include: {
      assignedUnit: { select: { code: true, name: true } },
      respondedBy: { select: { name: true, rank: true } },
      externalSystem: { select: { code: true, name: true, systemType: true } },
      mission: { select: { code: true } },
      command: { select: { docNo: true } },
    },
  });

  const stats = {
    open: incidents.filter((i) => i.status === "open").length,
    investigating: incidents.filter((i) => i.status === "investigating").length,
    critical: incidents.filter((i) => i.severity >= 8 && i.status !== "closed").length,
    closed: incidents.filter((i) => i.status === "closed").length,
  };

  const canCreate = ["ADMIN", "COMMANDER", "STAFF"].includes(role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={AlertOctagon}
        eyebrow="Command & Operation · TOR ๖.๔"
        title="ระบบจัดการเหตุการณ์ (Incident Management)"
        description="บริหารเหตุการณ์ — มอบหมายหน่วยรับ · เชื่อม Command/Mission · ปิดคดี + AAR"
        actions={
          canCreate && (
            <Link
              href="/command/incident/new"
              className="inline-flex items-center gap-1 text-sm rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700"
            >
              <PlusCircle className="h-4 w-4" />
              สร้างเหตุการณ์
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="เปิดใหม่ (รอจัดการ)" value={stats.open} accent="rose" />
        <Stat label="กำลังดำเนินการ" value={stats.investigating} accent="amber" />
        <Stat label="ระดับวิกฤต (≥8)" value={stats.critical} accent="rose" />
        <Stat label="ปิดคดี" value={stats.closed} accent="emerald" />
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <AlertOctagon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">ยังไม่มีเหตุการณ์</p>
          {canCreate && (
            <Link
              href="/command/incident/new"
              className="inline-flex items-center gap-1 text-sm rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700"
            >
              <PlusCircle className="h-4 w-4" />
              สร้างเหตุการณ์แรก
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => {
            const isClosed = inc.status === "closed";
            const SourceIcon = inc.externalSystem
              ? inc.externalSystem.systemType === "EMERGENCY_191"
                ? Phone
                : inc.externalSystem.systemType === "CCTV"
                  ? Video
                  : inc.externalSystem.systemType === "INTEL"
                    ? Eye
                    : Activity
              : Activity;
            return (
              <Link
                key={inc.id}
                href={`/command/incident/${inc.id}`}
                className={`block rounded-lg border ${
                  isClosed
                    ? "border-slate-200 bg-slate-50 opacity-70"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                } p-3 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${severityColor(inc.severity)}`} />
                    <div className="text-[10px] font-mono text-slate-400">{inc.severity}/10</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[11px] text-slate-500">{inc.code}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLOR[inc.type] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {inc.type}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STATUS_COLORS[inc.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {STATUS_LABELS[inc.status] ?? inc.status}
                      </span>
                      {inc.mission && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Mission: {inc.mission.code}
                        </span>
                      )}
                      {inc.command && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                          Command: {inc.command.docNo}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{inc.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      {inc.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {inc.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <SourceIcon className="h-3 w-3" />
                        {inc.externalSystem?.name ?? "แจ้งด้วยมือ"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(inc.reportedAt)}
                      </span>
                      {inc.assignedUnit && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {inc.assignedUnit.code}
                        </span>
                      )}
                      {inc.respondedBy && (
                        <span className="inline-flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {inc.respondedBy.rank ?? ""} {inc.respondedBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STAT_COLORS = {
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
} as const;

function Stat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: keyof typeof STAT_COLORS;
}) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[accent]} p-3`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
