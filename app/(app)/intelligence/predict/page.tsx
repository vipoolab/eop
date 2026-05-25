// /intelligence/predict — Grid of 8 predictive trends

import Link from "next/link";
import { TrendingUp, ChevronLeft, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listTrends } from "@/lib/intelligence/store";
import { TrendCard } from "./trend-card";

export const dynamic = "force-dynamic";

export default function PredictPage() {
  const trends = listTrends();
  const ups = trends.filter((t) => t.direction === "up").length;
  const downs = trends.filter((t) => t.direction === "down").length;
  const flat = trends.filter((t) => t.direction === "flat").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        eyebrow="ระบบ AI"
        title="พยากรณ์แนวโน้มอาชญากรรม / เหตุการณ์"
        description="Predictive Analytics — ทำนายแนวโน้ม ๓ เดือนข้างหน้าโดยอ้างอิงข้อมูลย้อนหลัง ๑๒ เดือน พร้อม Driver Factors ที่ส่งผลต่อการทำนาย"
        live
        actions={
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-[#1e3a5f] text-white flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              แนวโน้มที่ทำนาย
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none mt-1">
              {trends.length}
            </div>
          </div>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-red-600 text-white flex items-center justify-center">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              แนวโน้มสูงขึ้น
            </div>
            <div className="text-2xl font-bold text-red-700 leading-none mt-1">
              {ups}
            </div>
          </div>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-emerald-600 text-white flex items-center justify-center">
            <ArrowDownRight className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              แนวโน้มลดลง
            </div>
            <div className="text-2xl font-bold text-emerald-700 leading-none mt-1">
              {downs}
            </div>
          </div>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-slate-500 text-white flex items-center justify-center">
            <Minus className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              ทรงตัว
            </div>
            <div className="text-2xl font-bold text-slate-700 leading-none mt-1">
              {flat}
            </div>
          </div>
        </div>
      </div>

      {/* Trend grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {trends.map((t) => (
          <TrendCard key={t.id} trend={t} />
        ))}
      </div>
    </div>
  );
}
