// /command/incident/[id] — Detail + Timeline + Actions

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  AlertOctagon,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Video,
  Eye,
  Activity as ActivityIcon,
  Building2,
  UserCircle,
  Calendar,
} from "lucide-react";
import { IncidentActions } from "./incident-actions";

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
  open: "เปิดใหม่ (รอจัดการ)",
  investigating: "กำลังดำเนินการ",
  closed: "ปิดคดี",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-rose-100 text-rose-700 border-rose-300",
  investigating: "bg-amber-100 text-amber-700 border-amber-300",
  closed: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

const ACTION_LABELS: Record<string, string> = {
  "incident.create": "🆕 สร้างเหตุการณ์",
  "incident.update": "✏️ แก้ไขข้อมูล",
  "incident.assign": "👮 มอบหมายหน่วยรับ",
  "incident.respond": "🚨 หน่วยรับงานแล้ว",
  "incident.link": "🔗 ผูกกับ Command/Mission",
  "incident.close": "✅ ปิดคดี",
  "aar.create": "📝 สร้าง AAR",
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  const { id } = await params;

  const inc = await prisma.incident.findUnique({
    where: { id },
    include: {
      assignedUnit: true,
      respondedBy: { select: { id: true, name: true, rank: true } },
      mission: { select: { id: true, code: true, title: true } },
      command: { select: { id: true, docNo: true, subject: true } },
      externalSystem: { select: { code: true, name: true, systemType: true } },
      afterActionReviews: {
        orderBy: { reviewDate: "desc" },
        include: { facilitator: { select: { name: true, rank: true } } },
      },
    },
  });

  if (!inc) notFound();

  // Timeline from AuditLog
  const timeline = await prisma.auditLog.findMany({
    where: { target: `incident:${id}` },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, rank: true } } },
  });

  // Options for assign/link
  const [units, missions, commands] = await Promise.all([
    prisma.unit.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.mission.findMany({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "REPORTED"] } },
      select: { id: true, code: true, title: true },
      take: 50,
    }),
    prisma.command.findMany({
      where: { status: { in: ["PUBLISHED", "ACKNOWLEDGED", "IN_PROGRESS"] } },
      select: { id: true, docNo: true, subject: true },
      take: 50,
    }),
  ]);

  const SourceIcon = inc.externalSystem
    ? inc.externalSystem.systemType === "EMERGENCY_191"
      ? Phone
      : inc.externalSystem.systemType === "CCTV"
        ? Video
        : inc.externalSystem.systemType === "INTEL"
          ? Eye
          : ActivityIcon
    : ActivityIcon;

  const isClosed = inc.status === "closed";
  const canAssign = ["ADMIN", "COMMANDER"].includes(role) && !isClosed;
  const canRespond =
    ["ADMIN", "COMMANDER", "STAFF"].includes(role) && !isClosed && !inc.respondedById;
  const canLink = ["ADMIN", "COMMANDER"].includes(role) && !isClosed;
  const canClose = ["ADMIN", "COMMANDER"].includes(role) && !isClosed;
  const canAddAar = ["ADMIN", "COMMANDER", "AUDITOR"].includes(role) && isClosed;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/command/incident"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายการเหตุการณ์
      </Link>

      <PageHeader
        icon={AlertOctagon}
        eyebrow={`Incident · ${inc.code}`}
        title={inc.title}
        description={`ประเภท ${inc.type} · ความรุนแรง ${inc.severity}/10`}
      />

      {/* Status banner */}
      <div
        className={`rounded-xl border-2 p-4 flex items-center gap-3 ${STATUS_COLORS[inc.status] ?? "bg-slate-100 text-slate-700"}`}
      >
        <span className="text-3xl">
          {inc.status === "closed" ? "✅" : inc.status === "investigating" ? "🚨" : "⚠️"}
        </span>
        <div>
          <div className="text-sm font-semibold">{STATUS_LABELS[inc.status] ?? inc.status}</div>
          {inc.closedAt && (
            <div className="text-[11px] opacity-80">
              ปิดคดีเมื่อ{" "}
              {new Date(inc.closedAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          )}
        </div>
      </div>

      {/* Meta grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Meta icon={<AlertOctagon />} label="ประเภท">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLOR[inc.type] ?? ""}`}>
              {inc.type}
            </span>
          </Meta>
          <Meta icon={<Calendar />} label="เกิดเหตุ">
            {new Date(inc.occurredAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Meta>
          <Meta icon={<Clock />} label="แจ้งเข้าระบบ">
            {new Date(inc.reportedAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Meta>
          {inc.location && (
            <Meta icon={<MapPin />} label="พื้นที่">
              {inc.location}
            </Meta>
          )}
          <Meta icon={<SourceIcon />} label="แหล่งข้อมูล">
            {inc.externalSystem?.name ?? "แจ้งด้วยมือ (Manual)"}
          </Meta>
          {inc.externalRef && (
            <Meta icon={<ActivityIcon />} label="External Ref">
              <code className="text-[11px] font-mono">{inc.externalRef}</code>
            </Meta>
          )}
        </div>

        {inc.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              รายละเอียด
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{inc.description}</p>
          </div>
        )}
      </div>

      {/* Assignment & Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">หน่วยรับผิดชอบ</h3>
          </div>
          {inc.assignedUnit ? (
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {inc.assignedUnit.code}
              </div>
              <div className="text-[12px] text-slate-600">{inc.assignedUnit.name}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">ยังไม่ได้มอบหมาย</div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCircle className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">ผู้รับงาน</h3>
          </div>
          {inc.respondedBy ? (
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {inc.respondedBy.rank ?? ""} {inc.respondedBy.name}
              </div>
              {inc.respondedAt && (
                <div className="text-[11px] text-slate-500">
                  เริ่มดำเนินการ{" "}
                  {new Date(inc.respondedAt).toLocaleString("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400">ยังไม่มีผู้รับงาน</div>
          )}
        </div>
      </div>

      {/* Linked Mission/Command */}
      {(inc.mission || inc.command) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">🔗 เชื่อมกับระบบอื่น</h3>
          <div className="space-y-2">
            {inc.mission && (
              <Link
                href={`/agenda/missions/${inc.mission.id}`}
                className="block rounded bg-white border border-blue-200 p-2 hover:border-blue-400"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold mr-2">
                  Mission {inc.mission.code}
                </span>
                <span className="text-sm text-slate-700">{inc.mission.title}</span>
              </Link>
            )}
            {inc.command && (
              <Link
                href={`/command/workflow/${inc.command.id}`}
                className="block rounded bg-white border border-violet-200 p-2 hover:border-violet-400"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold mr-2">
                  Command {inc.command.docNo}
                </span>
                <span className="text-sm text-slate-700">{inc.command.subject}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <IncidentActions
        id={inc.id}
        canAssign={canAssign}
        canRespond={canRespond}
        canLink={canLink}
        canClose={canClose}
        canAddAar={canAddAar}
        currentAssignedUnitId={inc.assignedUnitId}
        currentMissionId={inc.missionId}
        currentCommandId={inc.commandId}
        units={units}
        missions={missions}
        commands={commands}
      />

      {/* AAR list */}
      {inc.afterActionReviews.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
            📝 After Action Reviews ({inc.afterActionReviews.length})
          </h2>
          <div className="space-y-2">
            {inc.afterActionReviews.map((a) => (
              <div key={a.id} className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3 text-emerald-600" />
                  <span className="text-[11px] text-emerald-800">
                    {new Date(a.reviewDate).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto">
                    Facilitator: {a.facilitator.rank ?? ""} {a.facilitator.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white rounded p-2 border border-emerald-200">
                    <strong className="text-emerald-800">✓ ดี:</strong>{" "}
                    <span className="text-slate-700">{a.whatWorked}</span>
                  </div>
                  <div className="bg-white rounded p-2 border border-rose-200">
                    <strong className="text-rose-800">✗ ต้องปรับ:</strong>{" "}
                    <span className="text-slate-700">{a.whatDidNot}</span>
                  </div>
                  <div className="bg-white rounded p-2 border border-amber-200">
                    <strong className="text-amber-800">📚 บทเรียน:</strong>{" "}
                    <span className="text-slate-700">{a.lessonsLearned}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          🕐 Timeline ของเหตุการณ์ ({timeline.length})
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          {timeline.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">ยังไม่มี timeline</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {timeline.map((t, idx) => (
                <div key={t.id} className="p-3 flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                      {idx + 1}
                    </div>
                    {idx < timeline.length - 1 && <div className="w-0.5 h-6 bg-slate-200 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-800">
                        {ACTION_LABELS[t.action] ?? t.action}
                      </span>
                      {t.user && (
                        <span className="text-[11px] text-slate-500">
                          โดย {t.user.rank ?? ""} {t.user.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(t.createdAt).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    {t.details ? (
                      <details className="mt-1">
                        <summary className="text-[10px] text-slate-500 cursor-pointer">รายละเอียด</summary>
                        <pre className="text-[10px] bg-slate-50 rounded p-1 mt-1 overflow-x-auto">
                          {JSON.stringify(t.details, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-slate-400 mt-0.5 h-4 w-4">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  );
}
