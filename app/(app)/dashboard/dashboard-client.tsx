"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Building2,
  FileEdit,
  MapPin,
} from "lucide-react";
import type { DataPoint } from "@/lib/dashboard/mock-data";
import {
  DEFAULT_FILTERS,
  TIME_RANGE_LABELS,
  applyFilters,
  type DashboardFilters,
} from "@/lib/dashboard/filters";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiStats } from "@/components/dashboard/kpi-stats";
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartLine } from "@/components/dashboard/chart-line";
import { ChartBar } from "@/components/dashboard/chart-bar";
import { ChartPie } from "@/components/dashboard/chart-pie";
import { ChartMap } from "@/components/dashboard/chart-map";
import { HotspotTable } from "@/components/dashboard/hotspot-table";

export function AnalyticsDashboard({ initialData }: { initialData: DataPoint[] }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  // Pin to data's max date so monthly/daily slicing is stable
  const referenceDate = useMemo(() => {
    const max = initialData.reduce((acc, d) => (d.date > acc ? d.date : acc), "");
    return max ? new Date(max) : new Date();
  }, [initialData]);

  const filtered = useMemo(
    () => applyFilters(initialData, filters, referenceDate),
    [initialData, filters, referenceDate]
  );

  // Build embed URL with current filters for fullscreen XR view
  function embedHref(chart: "line" | "bar" | "pie" | "map"): string {
    const sp = new URLSearchParams();
    sp.set("range", filters.timeRange);
    if (filters.unitId !== "all") sp.set("unit", filters.unitId);
    if (filters.region !== "all") sp.set("region", filters.region);
    if (filters.commandType !== "all") sp.set("type", filters.commandType);
    return `/dashboard/charts/${chart}?${sp.toString()}`;
  }

  return (
    <div className="space-y-5">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        filteredCount={filtered.length}
        totalCount={initialData.length}
      />

      <KpiStats data={filtered} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title={`แนวโน้ม${TIME_RANGE_LABELS[filters.timeRange]} — คำสั่งสั่งการและการปฏิบัติ`}
          icon={TrendingUp}
          embedHref={embedHref("line")}
        >
          <ChartLine data={filtered} timeRange={filters.timeRange} />
        </ChartCard>

        <ChartCard title="เปรียบเทียบหน่วยงาน" icon={Building2} embedHref={embedHref("bar")}>
          <ChartBar data={filtered} />
        </ChartCard>

        <ChartCard title="สัดส่วนตามประเภทคำสั่ง" icon={FileEdit} embedHref={embedHref("pie")}>
          <ChartPie data={filtered} />
        </ChartCard>

        <ChartCard title="แผนที่ GIS — เหตุการณ์ตามจังหวัด" icon={MapPin} embedHref={embedHref("map")}>
          <ChartMap data={filtered} height={400} />
        </ChartCard>
      </div>

      <HotspotTable data={filtered} />
    </div>
  );
}
