// /intelligence/dashboards/performance — Performance comparison dashboard

import Link from "next/link";
import { Trophy, ChevronLeft, Clock, CheckCircle, Heart, Award } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

interface UnitPerf {
  unit: string;
  responseTimeMin: number; // avg in minutes
  clearanceRate: number; // %
  satisfactionScore: number; // /100
  arrestRate: number; // %
}

const UNITS: UnitPerf[] = [
  { unit: "ภ.๕", responseTimeMin: 7.2, clearanceRate: 82, satisfactionScore: 86, arrestRate: 78 },
  { unit: "ภ.๑", responseTimeMin: 7.8, clearanceRate: 79, satisfactionScore: 82, arrestRate: 74 },
  { unit: "บช.น.", responseTimeMin: 8.4, clearanceRate: 75, satisfactionScore: 78, arrestRate: 76 },
  { unit: "ภ.๘", responseTimeMin: 8.6, clearanceRate: 78, satisfactionScore: 84, arrestRate: 72 },
  { unit: "ภ.๗", responseTimeMin: 9.2, clearanceRate: 73, satisfactionScore: 80, arrestRate: 70 },
  { unit: "ภ.๔", responseTimeMin: 9.8, clearanceRate: 80, satisfactionScore: 76, arrestRate: 82 },
  { unit: "ภ.๒", responseTimeMin: 10.2, clearanceRate: 71, satisfactionScore: 75, arrestRate: 68 },
  { unit: "ภ.๓", responseTimeMin: 10.8, clearanceRate: 69, satisfactionScore: 73, arrestRate: 71 },
  { unit: "ภ.๖", responseTimeMin: 11.5, clearanceRate: 67, satisfactionScore: 72, arrestRate: 65 },
  { unit: "ภ.๙", responseTimeMin: 12.4, clearanceRate: 64, satisfactionScore: 69, arrestRate: 73 },
];

export default function PerformanceDashboardPage() {
  // Compute averages for normalization
  const avgResponseTime =
    UNITS.reduce((acc, u) => acc + u.responseTimeMin, 0) / UNITS.length;
  const avgClearance =
    UNITS.reduce((acc, u) => acc + u.clearanceRate, 0) / UNITS.length;
  const avgSatisfaction =
    UNITS.reduce((acc, u) => acc + u.satisfactionScore, 0) / UNITS.length;
  const avgArrest =
    UNITS.reduce((acc, u) => acc + u.arrestRate, 0) / UNITS.length;

  // Best in each metric
  const bestResponse = UNITS.reduce((best, u) =>
    u.responseTimeMin < best.responseTimeMin ? u : best
  );
  const bestClearance = UNITS.reduce((best, u) =>
    u.clearanceRate > best.clearanceRate ? u : best
  );
  const bestSatisfaction = UNITS.reduce((best, u) =>
    u.satisfactionScore > best.satisfactionScore ? u : best
  );
  const bestArrest = UNITS.reduce((best, u) =>
    u.arrestRate > best.arrestRate ? u : best
  );

  // Composite score (higher = better; lower response time = better)
  const ranked = UNITS.map((u) => ({
    ...u,
    composite:
      (1 - u.responseTimeMin / 20) * 25 +
      u.clearanceRate * 0.25 +
      u.satisfactionScore * 0.25 +
      u.arrestRate * 0.25,
  })).sort((a, b) => b.composite - a.composite);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        eyebrow="แดชบอร์ดเฉพาะทาง"
        title="แดชบอร์ดผลการดำเนินงาน (Performance)"
        description="เปรียบเทียบผลงานระหว่างหน่วย — ระยะเวลาตอบสนอง อัตราการเคลียร์คดี ความพึงพอใจ"
        actions={
          <Link
            href="/intelligence/dashboards"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      {/* Best-of stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BestCard
          icon={Clock}
          label="ตอบสนองเร็วที่สุด"
          unit={bestResponse.unit}
          value={`${bestResponse.responseTimeMin} นาที`}
          avg={`เฉลี่ย ${avgResponseTime.toFixed(1)} นาที`}
        />
        <BestCard
          icon={CheckCircle}
          label="เคลียร์คดีสูงสุด"
          unit={bestClearance.unit}
          value={`${bestClearance.clearanceRate}%`}
          avg={`เฉลี่ย ${avgClearance.toFixed(1)}%`}
        />
        <BestCard
          icon={Heart}
          label="ความพึงพอใจสูงสุด"
          unit={bestSatisfaction.unit}
          value={`${bestSatisfaction.satisfactionScore}/100`}
          avg={`เฉลี่ย ${avgSatisfaction.toFixed(1)}`}
        />
        <BestCard
          icon={Award}
          label="จับกุมสำเร็จสูงสุด"
          unit={bestArrest.unit}
          value={`${bestArrest.arrestRate}%`}
          avg={`เฉลี่ย ${avgArrest.toFixed(1)}%`}
        />
      </div>

      {/* Composite leaderboard */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            อันดับรวม (Composite Score)
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {ranked.map((u, i) => (
            <li key={u.unit} className="px-5 py-3 flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-sm flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? "bg-amber-500 text-white"
                    : i === 1
                      ? "bg-slate-400 text-white"
                      : i === 2
                        ? "bg-amber-700 text-white"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {i + 1}
              </div>
              <div className="text-sm font-semibold text-slate-900 w-20">
                {u.unit}
              </div>
              <div className="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#d4a017] rounded-sm transition-all"
                  style={{ width: `${u.composite}%` }}
                />
              </div>
              <div className="text-sm tabular-nums font-bold text-slate-900 w-16 text-right">
                {u.composite.toFixed(1)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Detail comparison table */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ตัวเลขผลการดำเนินงานรายหน่วย
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2 font-semibold">บช./ภ.</th>
                <th className="text-right px-3 py-2 font-semibold">เวลาตอบสนอง</th>
                <th className="text-right px-3 py-2 font-semibold">เคลียร์คดี</th>
                <th className="text-right px-3 py-2 font-semibold">ความพึงพอใจ</th>
                <th className="text-right px-3 py-2 font-semibold">อัตราจับกุม</th>
              </tr>
            </thead>
            <tbody>
              {UNITS.map((u) => (
                <tr key={u.unit} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-semibold text-slate-900">{u.unit}</td>
                  <td className="text-right px-3 py-2.5 tabular-nums">
                    <span
                      className={
                        u.responseTimeMin < 9
                          ? "text-emerald-700 font-medium"
                          : u.responseTimeMin > 11
                            ? "text-red-700 font-medium"
                            : ""
                      }
                    >
                      {u.responseTimeMin.toFixed(1)} นาที
                    </span>
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums">
                    {u.clearanceRate}%
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums">
                    {u.satisfactionScore}/100
                  </td>
                  <td className="text-right px-3 py-2.5 tabular-nums">
                    {u.arrestRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-[11px] text-slate-500 italic">
        * เกณฑ์: เวลาตอบสนอง (น้ำหนัก ๒๕%) + เคลียร์คดี (๒๕%) + ความพึงพอใจ (๒๕%) + จับกุม (๒๕%)
      </div>
    </div>
  );
}

function BestCard({
  icon: Icon,
  label,
  unit,
  value,
  avg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  unit: string;
  value: string;
  avg: string;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-9 w-9 rounded-sm bg-[#d4a017] text-white flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold text-[#1e3a5f] leading-none">{unit}</div>
      <div className="text-sm font-bold text-slate-900 tabular-nums mt-1">
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-1">{avg}</div>
    </div>
  );
}
