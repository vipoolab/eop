// /data/operations/etl — ETL Jobs (TOR 8.10.2, 6.4.2)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  RefreshCcw,
  ArrowLeft,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  EXCEL: "Excel",
  CSV: "CSV",
  JSON: "JSON",
  API: "API",
  DATABASE: "Database",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export default async function EtlListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const jobs = await prisma.etlJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sourceSystem: { select: { code: true, name: true } },
      createdBy: { select: { name: true, rank: true } },
      _count: { select: { runs: true } },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          status: true,
          startedAt: true,
          finishedAt: true,
          recordsWritten: true,
          recordsFailed: true,
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
        icon={RefreshCcw}
        eyebrow="Data Operations · ETL"
        title="ETL Jobs"
        description="นำเข้า/แปลง/โหลดข้อมูล จาก Excel/CSV/JSON/API/DB — TOR 8.10.2"
      />

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Database className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-2">ยังไม่มี ETL Job</p>
          <p className="text-[11px] text-slate-400">
            ETL Job สร้างผ่าน seed script — ใช้สำหรับ scheduled imports
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => {
            const lastRun = j.runs[0];
            return (
              <div
                key={j.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${j.active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    <RefreshCcw className={`h-5 w-5 ${j.active ? "" : "opacity-50"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">{j.name}</h3>
                      {!j.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          ปิดใช้งาน
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                        {SOURCE_LABEL[j.sourceType] ?? j.sourceType}
                      </span>
                      {j.schedule && (
                        <span className="text-[10px] inline-flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          {j.schedule}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                      <span>
                        → {j.destinationTable}
                      </span>
                      {j.sourceSystem && (
                        <>
                          <span>·</span>
                          <span>จาก {j.sourceSystem.code}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{j._count.runs} ครั้ง</span>
                    </div>
                    {lastRun && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_COLORS[lastRun.status]}`}
                        >
                          {lastRun.status === "SUCCESS" && <CheckCircle2 className="h-3 w-3 inline mr-0.5" />}
                          {lastRun.status === "FAILED" && <XCircle className="h-3 w-3 inline mr-0.5" />}
                          {lastRun.status === "RUNNING" && <PlayCircle className="h-3 w-3 inline mr-0.5" />}
                          {lastRun.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(lastRun.startedAt).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        {lastRun.recordsWritten > 0 && (
                          <span className="text-[10px] text-emerald-700">
                            ✓ เขียน {lastRun.recordsWritten} แถว
                          </span>
                        )}
                        {lastRun.recordsFailed > 0 && (
                          <span className="text-[10px] text-rose-700">
                            ✗ ล้มเหลว {lastRun.recordsFailed} แถว
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
        💡 หมายเหตุ: ETL Jobs ใน demo นี้ใช้ schema จริง — เพิ่ม Job ผ่าน Prisma /
        seed script ได้
      </div>
    </div>
  );
}
