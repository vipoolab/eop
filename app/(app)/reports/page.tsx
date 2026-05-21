// /reports — Hub: รายงาน & สรุป (TOR 6.2, 6.4.4, 6.4.7)
// 3 ประเภทรายงาน: Executive Summary · SITREP · After Action Review

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  FileBarChart,
  FileText,
  AlertOctagon,
  RefreshCcw,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function ReportsHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) {
    redirect("/");
  }

  const [execSummary, sitrep, aar] = await Promise.all([
    prisma.executiveSummary.findFirst({
      orderBy: { generatedAt: "desc" },
      select: { generatedAt: true, title: true },
    }),
    prisma.situationReport.findFirst({
      orderBy: { reportDate: "desc" },
      select: { reportDate: true, reportNo: true },
    }),
    prisma.afterActionReview.findFirst({
      orderBy: { reviewDate: "desc" },
      select: { reviewDate: true },
    }),
  ]);

  const [execCount, sitrepCount, aarCount] = await Promise.all([
    prisma.executiveSummary.count(),
    prisma.situationReport.count(),
    prisma.afterActionReview.count(),
  ]);

  function ago(d: Date | null | undefined): string {
    if (!d) return "—";
    const ms = Date.now() - new Date(d).getTime();
    const hrs = Math.floor(ms / (1000 * 60 * 60));
    if (hrs < 24) return `${hrs} ชม.ก่อน`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} วันก่อน`;
    return new Date(d).toLocaleDateString("th-TH", { dateStyle: "medium" });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={FileBarChart}
        eyebrow="Data & AI · Reports"
        title="รายงาน & สรุป"
        description="รายงานสำหรับผู้บริหาร 3 ประเภท — AI ช่วยสร้าง + ส่งต่อ"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Executive Summary */}
        <Link
          href="/reports/exec-summary"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                Executive Summary
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 6.2 / 8.10.10</p>
            </div>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            AI สรุปสถานการณ์ทั้งระบบ — เห็นภาพรวมระดับชาติใน 1 หน้า
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{execCount} รายการ</span>
            <span className="text-blue-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              เปิด <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ล่าสุด {ago(execSummary?.generatedAt)}
          </div>
        </Link>

        {/* SITREP */}
        <Link
          href="/reports/sitrep"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">SITREP</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 6.4.7</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            Situation Report — รายงานสถานการณ์ปัจจุบัน ส่งผู้บริหาร
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{sitrepCount} รายการ</span>
            <span className="text-amber-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              เปิด <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ล่าสุด {ago(sitrep?.reportDate)}
          </div>
        </Link>

        {/* AAR */}
        <Link
          href="/reports/aar"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                After Action Review
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">TOR 6.4.4</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            ทบทวนหลังภารกิจ — สิ่งที่ดี / สิ่งที่ต้องปรับ / บทเรียน
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{aarCount} รายการ</span>
            <span className="text-emerald-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              เปิด <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ล่าสุด {ago(aar?.reviewDate)}
          </div>
        </Link>
      </div>
    </div>
  );
}
