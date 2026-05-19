import { KpiCard } from "@/components/kpi-card";
import { CommandLineChart } from "@/components/charts/command-line-chart";
import { UnitBarChart } from "@/components/charts/unit-bar-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { IncidentMap } from "@/components/charts/incident-map";
import { kpiCards, recentActivities } from "@/lib/mock-data";
import { AlertCircle, CheckCircle2, FileEdit, Sparkles } from "lucide-react";

const activityIcons: Record<string, React.ReactNode> = {
  command: <FileEdit className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
  report: <CheckCircle2 className="h-4 w-4" />,
  ai: <Sparkles className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  alert: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            แดชบอร์ดภาพรวม
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ภาพรวมการปฏิบัติงานสำนักงานยุทธศาสตร์ตำรวจ — ปีงบประมาณ ๒๕๖๘
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Real-time
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 border border-amber-200">
            TOR ข้อ 1.3 + 5.7 + 6.1
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts row 1: Line + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                แนวโน้มคำสั่งรายเดือน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                12 เดือนย้อนหลัง — Line Chart
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              TOR PoC ข้อ 4 (ก.๑)
            </span>
          </div>
          <CommandLineChart />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                สัดส่วนสถานะคำสั่ง
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pie Chart
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ๔ (ก.๓)
            </span>
          </div>
          <StatusPieChart />
        </div>
      </div>

      {/* Charts row 2: Bar + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                คำสั่งแยกตามหน่วยงาน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                6 หน่วย ตาม TOR PoC ข้อ 2 — Bar Chart
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ๔ (ก.๒)
            </span>
          </div>
          <UnitBarChart />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                แผนที่เหตุการณ์สำคัญ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                GIS Heatmap — Mapbox/Leaflet
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ๔ (ก.๔) / TOR 6.1
            </span>
          </div>
          <IncidentMap />
        </div>
      </div>

      {/* Recent activities */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              กิจกรรมล่าสุด
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time event feed — TOR ข้อ 8.6
            </p>
          </div>
          <a
            href="#"
            className="text-xs text-blue-700 font-medium hover:underline"
          >
            ดูทั้งหมด
          </a>
        </div>
        <div className="space-y-3">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activityColors[act.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {activityIcons[act.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {act.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-mono">{act.unit}</span>
                  <span>•</span>
                  <span>{act.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
