"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  const trendFlat = change === 0;
  const Icon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
      <div className="text-xs font-medium text-slate-500 leading-tight">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">
          {unit === "%" ? value.toFixed(1) : formatThaiNumber(value)}
        </span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded",
            trendFlat
              ? "bg-slate-100 text-slate-600"
              : trendUp
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
          )}
        >
          <Icon className="h-3 w-3" />
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-slate-500 truncate">{sub}</span>
      </div>
    </div>
  );
}
