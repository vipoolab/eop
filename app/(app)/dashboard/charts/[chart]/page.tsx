// /dashboard/charts/[chart] — fullscreen per-chart view (for XR/VR embedding)
// Each chart can be opened individually and shown in a virtual screen.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  Building2,
  FileEdit,
  MapPin,
} from "lucide-react";
import { getDashboardData } from "@/lib/dashboard/mock-data";
import { applyFilters, filtersFromSearchParams, TIME_RANGE_LABELS } from "@/lib/dashboard/filters";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ChartLine } from "@/components/dashboard/chart-line";
import { ChartBar } from "@/components/dashboard/chart-bar";
import { ChartPie } from "@/components/dashboard/chart-pie";
import { ChartMap } from "@/components/dashboard/chart-map";
import { ChartEmbedClient } from "./chart-embed-client";

export const dynamic = "force-dynamic";

const CHART_META: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
  line: { title: "แนวโน้มคำสั่งและการปฏิบัติ", icon: TrendingUp },
  bar: { title: "เปรียบเทียบหน่วยงาน", icon: Building2 },
  pie: { title: "สัดส่วนตามประเภทคำสั่ง", icon: FileEdit },
  map: { title: "แผนที่ GIS — เหตุการณ์ตามจังหวัด", icon: MapPin },
};

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ chart: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { chart } = await params;
  const sp = await searchParams;

  if (!CHART_META[chart]) notFound();

  const data = getDashboardData();
  const initialFilters = filtersFromSearchParams(sp);
  const filtered = applyFilters(data, initialFilters, new Date(
    data.reduce((acc, d) => (d.date > acc ? d.date : acc), "")
  ));

  const meta = CHART_META[chart];
  const Icon = meta.icon;
  const embed = sp.embed === "1";

  return (
    <div className={embed ? "min-h-screen bg-white dark:bg-slate-950 p-4" : "space-y-5"}>
      {/* Header — minimal in embed mode */}
      {!embed && (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ Dashboard
          </Link>
          <div className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
            XR-Ready Chart Component · {filtered.length.toLocaleString()} records
          </div>
        </div>
      )}

      {/* Title bar */}
      <header
        className={`flex items-center gap-3 ${
          embed ? "border-b border-slate-200 dark:border-slate-800 pb-3" : "rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3"
        }`}
      >
        <div className="h-10 w-10 rounded-sm bg-[#1e3a5f] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#d4a017]" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#b8860b]">
            CHART · {chart.toUpperCase()}
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {meta.title}
          </h1>
          <div className="text-[11px] text-slate-500">
            ช่วงเวลา: {TIME_RANGE_LABELS[initialFilters.timeRange]} · {filtered.length.toLocaleString()} records
          </div>
        </div>
      </header>

      {/* Live filter bar — only when not in embed mode */}
      {!embed && (
        <ChartEmbedClient
          allData={data}
          initialFilters={initialFilters}
          chart={chart}
        />
      )}

      {/* Static chart (SSR — uses url filters) */}
      {embed && (
        <div className={`mt-4 ${chart === "map" ? "h-[calc(100vh-180px)]" : "h-[calc(100vh-180px)]"}`}>
          {chart === "line" && <ChartLine data={filtered} timeRange={initialFilters.timeRange} height={undefined} />}
          {chart === "bar" && <ChartBar data={filtered} height={undefined} />}
          {chart === "pie" && <ChartPie data={filtered} height={undefined} />}
          {chart === "map" && <ChartMap data={filtered} height={700} />}
        </div>
      )}

      {/* Embed link footer */}
      {!embed && (
        <div className="text-center text-[10px] text-slate-500">
          📺 สำหรับใช้ใน XR Headset:{" "}
          <Link
            href={`/dashboard/charts/${chart}?${new URLSearchParams({ ...Object.fromEntries(
              Object.entries(sp).filter(([, v]) => typeof v === "string")
            ), embed: "1" } as Record<string, string>).toString()}`}
            target="_blank"
            className="text-[#1e3a5f] dark:text-amber-400 hover:underline"
          >
            เปิดในโหมด fullscreen embed
          </Link>
          {" "}เพื่อแสดงใน virtual screen
        </div>
      )}
    </div>
  );
}
