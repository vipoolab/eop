// Shared filter types + helpers for dashboard charts

import type { CommandType, DataPoint } from "./mock-data";

export type TimeRange = "daily" | "monthly" | "yearly";

export interface DashboardFilters {
  timeRange: TimeRange;
  unitId: string | "all";
  region: string | "all";
  commandType: CommandType | "all";
}

export const DEFAULT_FILTERS: DashboardFilters = {
  timeRange: "monthly",
  unitId: "all",
  region: "all",
  commandType: "all",
};

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  daily: "รายวัน",
  monthly: "รายเดือน",
  yearly: "รายปี",
};

/**
 * Apply non-time filters + time-range slice. Returns filtered DataPoint[].
 */
export function applyFilters(
  data: DataPoint[],
  filters: DashboardFilters,
  referenceDate: Date
): DataPoint[] {
  // 1) Non-time filters
  const base = data.filter((d) => {
    if (filters.unitId !== "all" && d.unitId !== filters.unitId) return false;
    if (filters.region !== "all" && d.region !== filters.region) return false;
    if (filters.commandType !== "all" && d.commandType !== filters.commandType) return false;
    return true;
  });

  // 2) Time range
  if (filters.timeRange === "daily") {
    const cutoff = new Date(referenceDate);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return base.filter((d) => d.date >= cutoffStr);
  }
  if (filters.timeRange === "monthly") {
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - 12);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return base.filter((d) => d.date >= cutoffStr);
  }
  // yearly → all
  return base;
}

export function formatPeriod(s: string, range: TimeRange): string {
  if (range === "yearly") return `พ.ศ. ${Number(s) + 543}`;
  if (range === "monthly") {
    const [y, m] = s.split("-");
    const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
    return `${months[Number(m) - 1]} ${String((Number(y) + 543) % 100).padStart(2, "0")}`;
  }
  return s.slice(5);
}

/**
 * URL search params → DashboardFilters. Used by per-chart embed pages.
 */
export function filtersFromSearchParams(
  sp: { [key: string]: string | string[] | undefined }
): DashboardFilters {
  function get(k: string): string | undefined {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  }
  const tr = (get("range") ?? "monthly") as TimeRange;
  return {
    timeRange: (["daily", "monthly", "yearly"] as TimeRange[]).includes(tr) ? tr : "monthly",
    unitId: get("unit") ?? "all",
    region: get("region") ?? "all",
    commandType: (get("type") ?? "all") as CommandType | "all",
  };
}
