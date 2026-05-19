// Command Detail Page — TOR 5.4.4, 4.1, 4.3
// Shows full command + status history + transition buttons

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { findCommandById } from "@/features/commands/repository";
import { getAvailableTransitions } from "@/features/commands/workflow";
import { TorBanner } from "@/components/tor-banner";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type CommandStatus,
  type CommandPriority,
} from "@/features/commands/types";
import { TransitionActions } from "./transition-actions";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Building2,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function CommandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const command = await findCommandById(id);
  if (!command) notFound();

  const status = command.status as CommandStatus;
  const role = session.user.role as Role;
  const transitions = getAvailableTransitions(status, role);

  return (
    <div className="space-y-6">
      <TorBanner
        torRefs={["5.4.4", "4.1", "4.3"]}
        system="ระบบ 4: Command & Operation"
        description="รายละเอียดคำสั่ง + วงจรสถานะ + Read Receipt"
      />

      {/* Back link */}
      <Link
        href="/command/workflow"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปยัง Kanban
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-slate-500">
                {command.docNo}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS_COLORS[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  PRIORITY_COLORS[command.priority as CommandPriority]
                }`}
              >
                {PRIORITY_LABELS[command.priority as CommandPriority]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {command.subject}
            </h1>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <Meta
            icon={<User className="h-4 w-4" />}
            label="ผู้ร่าง"
            value={`${command.creator.rank ?? ""} ${command.creator.name}`}
          />
          <Meta
            icon={<Clock className="h-4 w-4" />}
            label="สร้างเมื่อ"
            value={new Date(command.createdAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          {command.signer && (
            <Meta
              icon={<FileText className="h-4 w-4" />}
              label="ผู้ลงนาม"
              value={`${command.signer.rank ?? ""} ${command.signer.name}`}
            />
          )}
          {command.publishedAt && (
            <Meta
              icon={<Clock className="h-4 w-4" />}
              label="เผยแพร่เมื่อ"
              value={new Date(command.publishedAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
          )}
        </div>
      </div>

      {/* Body card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Content */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              เนื้อหาคำสั่ง
            </h2>
            <div className="space-y-3 text-sm text-slate-800">
              <Field label="ผู้รับ" value={command.recipient} />
              {command.reference && (
                <Field label="อ้างถึง" value={command.reference} />
              )}
              {command.objective && (
                <Field label="วัตถุประสงค์" value={command.objective} />
              )}
              <div>
                <div className="text-xs text-slate-500 mb-1">รายละเอียด</div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-800 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {command.body}
                </div>
              </div>
              {command.aiAssisted && (
                <div className="inline-flex items-center gap-2 rounded-md bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs text-violet-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                  ร่างด้วย AI Assistant
                </div>
              )}
            </div>
          </div>

          {/* Targets (Read Receipt) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              หน่วยรับคำสั่ง ({command.targets.length})
              <span className="ml-auto text-xs text-slate-500">
                รับทราบ:{" "}
                {command.targets.filter((t) => t.acknowledged).length}/
                {command.targets.length}
              </span>
            </h2>
            <div className="space-y-2">
              {command.targets.length === 0 ? (
                <p className="text-sm text-slate-500 italic">ยังไม่มีหน่วยรับ</p>
              ) : (
                command.targets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {t.acknowledged ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300" />
                      )}
                      <span className="text-sm font-medium text-slate-800">
                        {t.unit.code} — {t.unit.name}
                      </span>
                    </div>
                    {t.acknowledged && t.acknowledgedAt && (
                      <span className="text-xs text-slate-500">
                        {new Date(t.acknowledgedAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Transitions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              การดำเนินการ
            </h2>
            {transitions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {status === "CLOSED"
                  ? "คำสั่งนี้ปิดแล้ว"
                  : `บทบาท ${role} ไม่มี action ที่ทำได้ในสถานะนี้`}
              </p>
            ) : (
              <TransitionActions commandId={command.id} transitions={transitions} />
            )}
          </div>

          {/* Status history */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              ประวัติสถานะ
            </h2>
            <ol className="space-y-3">
              {command.statusLog.length === 0 ? (
                <li className="text-xs text-slate-500 italic">ยังไม่มีประวัติ</li>
              ) : (
                command.statusLog.map((log, idx) => (
                  <li
                    key={log.id}
                    className="relative pl-5 border-l-2 border-slate-200 pb-3 last:pb-0"
                  >
                    <span
                      className={`absolute -left-[5px] top-1 h-2 w-2 rounded-full ${
                        idx === 0 ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    />
                    <div className="text-xs">
                      <span className="text-slate-500">
                        {log.from
                          ? `${STATUS_LABELS[log.from as CommandStatus]} → `
                          : "เริ่ม → "}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {STATUS_LABELS[log.to as CommandStatus]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(log.createdAt).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    {log.note && (
                      <div className="text-[11px] text-slate-600 mt-1 italic">
                        “{log.note}”
                      </div>
                    )}
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}
