// Security & Audit Log — real data from AuditLog table

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  Lock,
  Activity,
  FileText,
  Sparkles,
  LogIn,
  Search,
  CheckCircle2,
} from "lucide-react";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

const ACTION_META: Record<
  string,
  { label: string; icon: typeof Lock; color: string; bg: string }
> = {
  "auth.login": {
    label: "เข้าสู่ระบบ",
    icon: LogIn,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  "auth.login.failed": {
    label: "เข้าสู่ระบบล้มเหลว",
    icon: LogIn,
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
  },
  "command.create": {
    label: "สร้างคำสั่ง",
    icon: FileText,
    color: "text-[#1e3a5f]",
    bg: "bg-[#1e3a5f]/5 border-[#1e3a5f]/20",
  },
  "command.submit": {
    label: "ส่งคำสั่ง",
    icon: FileText,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  "command.approve": {
    label: "อนุมัติคำสั่ง",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  "ai.command.draft": {
    label: "AI ร่างคำสั่ง",
    icon: Sparkles,
    color: "text-[#b8860b]",
    bg: "bg-[#b8860b]/5 border-[#b8860b]/30",
  },
  "ai.document.classify": {
    label: "AI จำแนกเอกสาร",
    icon: Sparkles,
    color: "text-[#b8860b]",
    bg: "bg-[#b8860b]/5 border-[#b8860b]/30",
  },
  "ai.ocr": {
    label: "OCR",
    icon: Sparkles,
    color: "text-[#b8860b]",
    bg: "bg-[#b8860b]/5 border-[#b8860b]/30",
  },
  "search.basic": {
    label: "ค้นหาพื้นฐาน",
    icon: Search,
    color: "text-slate-700",
    bg: "bg-slate-50 border-slate-200",
  },
  "search.fulltext": {
    label: "Full-text Search",
    icon: Search,
    color: "text-slate-700",
    bg: "bg-slate-50 border-slate-200",
  },
  "search.semantic": {
    label: "AI Semantic Search",
    icon: Sparkles,
    color: "text-[#b8860b]",
    bg: "bg-[#b8860b]/5 border-[#b8860b]/30",
  },
};

const DEFAULT_META = {
  label: "กิจกรรม",
  icon: Activity,
  color: "text-slate-700",
  bg: "bg-slate-50 border-slate-200",
};

function getMeta(action: string) {
  return ACTION_META[action] ?? DEFAULT_META;
}

// timeAgo imported from "@/lib/time"

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [logs, totalLogs, totalToday, byAction] = await Promise.all([
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true, rank: true, role: true } },
      },
    }),
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Lock}
        eyebrow="Security & Compliance"
        title="บันทึกกิจกรรมและตรวจสอบความปลอดภัย"
        description="Audit Trail — บันทึกทุกการกระทำในระบบ ตั้งแต่ login จนถึงการแก้ไขข้อมูล เพื่อการตรวจสอบย้อนหลัง"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="กิจกรรมทั้งหมด"
          value={totalLogs}
          sub="ตั้งแต่เริ่มระบบ"
        />
        <StatCard
          label="24 ชั่วโมงที่ผ่านมา"
          value={totalToday}
          sub="กิจกรรมล่าสุด"
        />
        <StatCard
          label="ประเภทกิจกรรม"
          value={byAction.length}
          sub="ที่ตรวจพบ"
        />
      </div>

      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          กิจกรรมที่พบบ่อย
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {byAction.map((a) => {
            const meta = getMeta(a.action);
            return (
              <div key={a.action} className={`rounded-sm border p-3 ${meta.bg}`}>
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${meta.color}`}>
                  {meta.label}
                </div>
                <div className="text-lg font-semibold text-slate-900 tabular-nums mt-1">
                  {a._count.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            กิจกรรมล่าสุด ({logs.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            แสดงผล 50 รายการล่าสุด
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            const meta = getMeta(log.action);
            const Icon = meta.icon;
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border ${meta.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {log.user ? (
                      <>
                        <span className="font-medium text-slate-700">
                          {log.user.rank} {log.user.name}
                        </span>{" "}
                        <span className="text-slate-400">({log.user.role})</span>
                      </>
                    ) : (
                      "ระบบ"
                    )}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {timeAgo(log.createdAt)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                    {log.target}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-sm border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-4 text-xs text-slate-700 leading-relaxed">
        <strong className="text-[#1e3a5f]">การรักษาความปลอดภัยตามมาตรฐาน CII</strong>{" "}
        — ข้อมูลทุกบรรทัดถูกบันทึกอัตโนมัติเพื่อการตรวจสอบ ไม่สามารถลบหรือแก้ไขได้
        เก็บรักษาเป็นเวลา 7 ปี ตามระเบียบสำนักนายกรัฐมนตรี
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
