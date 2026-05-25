"use client";

import { useMemo, useState } from "react";
import {
  applyFilters,
  type DashboardFilters,
} from "@/lib/dashboard/filters";
import type { DataPoint } from "@/lib/dashboard/mock-data";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ChartLine } from "@/components/dashboard/chart-line";
import { ChartBar } from "@/components/dashboard/chart-bar";
import { ChartPie } from "@/components/dashboard/chart-pie";
import { ChartMap } from "@/components/dashboard/chart-map";

interface Props {
  allData: DataPoint[];
  initialFilters: DashboardFilters;
  chart: string;
}

/**
 * Client-side interactive view: filter bar + chart. Used in /dashboard/charts/[chart] (non-embed).
 */
export function ChartEmbedClient({ allData, initialFilters, chart }: Props) {
  const [filters, setFilters] = useState(initialFilters);

  const referenceDate = useMemo(() => {
    const max = allData.reduce((acc, d) => (d.date > acc ? d.date : acc), "");
    return max ? new Date(max) : new Date();
  }, [allData]);

  const filtered = useMemo(
    () => applyFilters(allData, filters, referenceDate),
    [allData, filters, referenceDate]
  );

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        filteredCount={filtered.length}
        totalCount={allData.length}
      />

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-4">
        {chart === "line" && (
          <ChartLine data={filtered} timeRange={filters.timeRange} height={500} />
        )}
        {chart === "bar" && <ChartBar data={filtered} height={500} />}
        {chart === "pie" && <ChartPie data={filtered} height={500} />}
        {chart === "map" && <ChartMap data={filtered} height={600} />}
      </section>
    </div>
  );
}
