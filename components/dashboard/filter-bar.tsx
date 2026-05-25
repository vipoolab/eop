"use client";

import { Calendar, Building2, MapPin, FileEdit, Filter, X } from "lucide-react";
import {
  COMMAND_TYPES,
  REGIONS,
  type CommandType,
} from "@/lib/dashboard/mock-data";
import {
  TIME_RANGE_LABELS,
  type DashboardFilters,
  type TimeRange,
} from "@/lib/dashboard/filters";

interface Props {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  filteredCount?: number;
  totalCount?: number;
  /** Hide the active filter chips row (for compact embeds) */
  compact?: boolean;
}

export function FilterBar({ filters, onChange, filteredCount, totalCount, compact }: Props) {
  const isFiltered =
    filters.unitId !== "all" ||
    filters.region !== "all" ||
    filters.commandType !== "all";

  function reset() {
    onChange({ ...filters, unitId: "all", region: "all", commandType: "all" });
  }

  return (
    <section className="rounded-sm border-2 border-[#1e3a5f]/30 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-[#1e3a5f] dark:text-amber-400" />
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          ตัวกรองข้อมูล
        </span>
        {isFiltered && (
          <button
            type="button"
            suppressHydrationWarning
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400"
          >
            <X className="h-3 w-3" />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Calendar className="inline h-3 w-3 mr-1" />
            ช่วงเวลา
          </label>
          <div className="inline-flex w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
            {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                suppressHydrationWarning
                onClick={() => onChange({ ...filters, timeRange: r })}
                className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-sm transition-colors ${
                  filters.timeRange === r
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {TIME_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Building2 className="inline h-3 w-3 mr-1" />
            หน่วยงาน
          </label>
          <select
            value={filters.unitId}
            onChange={(e) => onChange({ ...filters, unitId: e.target.value })}
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none"
          >
            <option value="all">ทุกหน่วย ({REGIONS.length})</option>
            {REGIONS.map((r) => (
              <option key={r.unitId} value={r.unitId}>
                {r.unitName} — {r.region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <MapPin className="inline h-3 w-3 mr-1" />
            พื้นที่
          </label>
          <select
            value={filters.region}
            onChange={(e) => onChange({ ...filters, region: e.target.value })}
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none"
          >
            <option value="all">ทุกภาค</option>
            {REGIONS.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <FileEdit className="inline h-3 w-3 mr-1" />
            ประเภทข้อสั่งการ
          </label>
          <select
            value={filters.commandType}
            onChange={(e) =>
              onChange({ ...filters, commandType: e.target.value as CommandType | "all" })
            }
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none"
          >
            <option value="all">ทุกประเภท</option>
            {COMMAND_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!compact && isFiltered && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1 mt-1">
            ตัวกรองที่ใช้:
          </div>
          {filters.unitId !== "all" && (
            <FilterChip
              label={`หน่วย: ${REGIONS.find((r) => r.unitId === filters.unitId)?.unitName ?? filters.unitId}`}
              onClear={() => onChange({ ...filters, unitId: "all" })}
            />
          )}
          {filters.region !== "all" && (
            <FilterChip
              label={`พื้นที่: ${filters.region}`}
              onClear={() => onChange({ ...filters, region: "all" })}
            />
          )}
          {filters.commandType !== "all" && (
            <FilterChip
              label={`ประเภท: ${filters.commandType}`}
              onClear={() => onChange({ ...filters, commandType: "all" })}
            />
          )}
        </div>
      )}

      {filteredCount !== undefined && totalCount !== undefined && (
        <div className="text-[10px] text-slate-500 mt-2.5">
          กำลังแสดงข้อมูล{" "}
          <strong className="text-slate-900 dark:text-slate-100">{filteredCount.toLocaleString()}</strong>{" "}
          รายการ จาก <strong>{totalCount.toLocaleString()}</strong> รายการทั้งหมด
        </div>
      )}
    </section>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#1e3a5f] text-white px-2 py-1 rounded-sm">
      {label}
      <button
        type="button"
        suppressHydrationWarning
        onClick={onClear}
        className="hover:bg-white/20 rounded-sm p-0.5"
        aria-label="ลบ"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
