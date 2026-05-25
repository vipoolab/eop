"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { DataPoint } from "@/lib/dashboard/mock-data";

interface Props {
  data: DataPoint[];
  topN?: number;
}

export function HotspotTable({ data, topN = 10 }: Props) {
  const provinceData = useMemo(() => {
    const buckets = new Map<string, { name: string; incidents: number; commands: number }>();
    for (const d of data) {
      const b = buckets.get(d.province) ?? { name: d.province, incidents: 0, commands: 0 };
      b.incidents += d.incidents;
      b.commands += d.commandsIssued;
      buckets.set(d.province, b);
    }
    return Array.from(buckets.values()).sort((a, b) => b.incidents - a.incidents).slice(0, topN);
  }, [data, topN]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#b8860b]" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Top {topN} จังหวัดที่มีเหตุการณ์มากที่สุด
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left px-4 py-2 w-12">#</th>
            <th className="text-left px-4 py-2">จังหวัด</th>
            <th className="text-right px-4 py-2">เหตุการณ์</th>
            <th className="text-right px-4 py-2">คำสั่ง</th>
            <th className="text-left px-4 py-2 w-48">สัดส่วน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {provinceData.map((p, i) => {
            const max = provinceData[0]?.incidents ?? 1;
            const pct = (p.incidents / max) * 100;
            return (
              <tr key={p.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-2 text-xs font-bold text-slate-500">
                  {i === 0 && "🥇"}
                  {i === 1 && "🥈"}
                  {i === 2 && "🥉"}
                  {i > 2 && `#${i + 1}`}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                <td className="px-4 py-2 text-sm tabular-nums text-right text-slate-700 dark:text-slate-300">
                  {p.incidents.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm tabular-nums text-right text-slate-600 dark:text-slate-400">
                  {p.commands.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${pct}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
