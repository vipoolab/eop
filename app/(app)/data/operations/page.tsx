// /data/operations — Admin Hub (TOR 6.4.1, 8.10.1-2)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  Database,
  RefreshCcw,
  ShieldCheck,
  Globe,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function DataOpsHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (role !== "ADMIN") redirect("/");

  const [
    etlActive,
    etlRunsToday,
    etlFailures,
    dqRules,
    dqFailures,
    externalTotal,
    externalActive,
  ] = await Promise.all([
    prisma.etlJob.count({ where: { active: true } }),
    prisma.etlRun.count({
      where: { startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.etlRun.count({ where: { status: "FAILED" } }),
    prisma.dataQualityRule.count({ where: { active: true } }),
    prisma.dataQualityCheck.count({
      where: { passed: false },
    }),
    prisma.externalSystem.count(),
    prisma.externalSystem.count({ where: { active: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Database}
        eyebrow="Data & AI · Operations (Admin)"
        title="Data Operations"
        description="ETL Pipeline · Data Quality · External Systems — สำหรับ Admin เท่านั้น"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ETL */}
        <Link
          href="/data/operations/etl"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">ETL Jobs</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 8.10.2</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            นำเข้า/แปลง/โหลดข้อมูล — รองรับ Excel/CSV/JSON (TOR 6.4.2)
          </p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mb-1">
            <div>Active: <strong className="text-slate-800">{etlActive}</strong></div>
            <div>วันนี้: <strong className="text-slate-800">{etlRunsToday}</strong></div>
            <div>ล้มเหลว: <strong className={etlFailures > 0 ? "text-rose-700" : "text-slate-800"}>{etlFailures}</strong></div>
          </div>
          <div className="text-blue-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            เปิด <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        {/* Data Quality */}
        <Link
          href="/data/operations/quality"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">Data Quality</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 8.10.2</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            กฎตรวจคุณภาพข้อมูล + ประวัติการตรวจ
          </p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mb-1">
            <div>Rules: <strong className="text-slate-800">{dqRules}</strong></div>
            <div>Fail: <strong className={dqFailures > 0 ? "text-amber-700" : "text-slate-800"}>{dqFailures}</strong></div>
          </div>
          <div className="text-amber-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            เปิด <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        {/* External Systems */}
        <Link
          href="/data/operations/external"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">External Systems</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 6.4.1</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            สถานะการเชื่อม 191 / CCTV / ข่าวกรอง / อุตุนิยม ผ่าน API
          </p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mb-1">
            <div>Total: <strong className="text-slate-800">{externalTotal}</strong></div>
            <div>Active: <strong className="text-emerald-700">{externalActive}</strong></div>
          </div>
          <div className="text-emerald-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[11px] font-semibold">
            เปิด <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>
    </div>
  );
}
