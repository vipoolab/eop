// /data/operations/external — External Systems integration (TOR 6.4.1)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  Globe,
  ArrowLeft,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, { label: string; emoji: string }> = {
  EMERGENCY_191: { label: "ศูนย์รับแจ้ง 191", emoji: "🚨" },
  CCTV: { label: "กล้องวงจรปิด", emoji: "📹" },
  INTEL: { label: "ข่าวกรอง", emoji: "🔎" },
  WEATHER: { label: "กรมอุตุนิยมวิทยา", emoji: "🌧️" },
  TRANSPORT: { label: "กรมการขนส่ง", emoji: "🚗" },
  CIVIL: { label: "กรมการปกครอง", emoji: "🏛️" },
  SIGN_TDID: { label: "TDID e-Signature", emoji: "✍️" },
  SIGN_TDA: { label: "TDA e-Signature", emoji: "🔐" },
};

export default async function ExternalSystemsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const systems = await prisma.externalSystem.findMany({
    orderBy: { systemType: "asc" },
    include: {
      _count: { select: { integrationLogs: true } },
      integrationLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          createdAt: true,
          action: true,
          responseStatus: true,
          latencyMs: true,
          errorMessage: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/data/operations"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยัง Data Operations
      </Link>

      <PageHeader
        icon={Globe}
        eyebrow="Data Operations · External Systems"
        title="External Systems"
        description="ระบบภายนอกที่เชื่อมต่อผ่าน API — TOR 6.4.1"
      />

      {systems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Globe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">ยังไม่มี External System</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {systems.map((s) => {
            const meta = TYPE_LABEL[s.systemType] ?? {
              label: s.systemType,
              emoji: "🌐",
            };
            const lastLog = s.integrationLogs[0];
            const isHealthy =
              lastLog && lastLog.responseStatus && lastLog.responseStatus < 400;
            return (
              <div
                key={s.id}
                className={`rounded-xl border-2 ${s.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"} p-4`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {s.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {meta.label} · <code className="font-mono">{s.code}</code>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s.active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Wifi className="h-3 w-3" />
                        ออนไลน์
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        <WifiOff className="h-3 w-3" />
                        ปิด
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  {s.baseUrl && (
                    <div className="font-mono text-[10px] text-slate-500 truncate">
                      {s.baseUrl}
                    </div>
                  )}
                  {s.authMethod && (
                    <div>
                      <span className="text-slate-500">Auth:</span> {s.authMethod}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-2">
                    <span className="text-slate-500">Logs:</span>
                    <span className="font-semibold">{s._count.integrationLogs}</span>
                    {s.lastSyncAt && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">
                          ล่าสุด{" "}
                          {new Date(s.lastSyncAt).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  {lastLog && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {isHealthy ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-rose-600" />
                      )}
                      <span className="text-[10px] text-slate-500">
                        {lastLog.action}
                      </span>
                      {lastLog.responseStatus && (
                        <span className="text-[10px] font-mono">
                          HTTP {lastLog.responseStatus}
                        </span>
                      )}
                      {lastLog.latencyMs !== null && (
                        <span className="text-[10px] text-slate-500">
                          {lastLog.latencyMs}ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
        💡 หมายเหตุ: TOR 6.4.1 — รองรับ API integration กับ 191/CCTV/ข่าวกรอง
        ใน demo นี้ใช้ schema mock — Production ต้อง config endpoint จริงต่อหน่วยงาน
      </div>
    </div>
  );
}
