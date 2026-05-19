"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatThaiNumber } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  change: number;
  sub: string;
  unit?: string;
}

export function KpiCard({ label, value, change, sub, unit }: KpiCardProps) {
  const trendUp = change > 0;
  const trendDown = change < 0;
  const showTrend = trendUp || trendDown;
  const Icon = trendUp ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 leading-tight">
        {label}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
          {unit === "%" ? value.toFixed(1) : formatThaiNumber(value)}
        </span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {showTrend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded",
              trendUp
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            )}
          >
            <Icon className="h-3 w-3" />
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        <span className="text-slate-500 truncate">{sub}</span>
      </div>
    </div>
  );
}
