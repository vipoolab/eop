"use client";

// Wrapper that dynamically loads Leaflet map (SSR disabled).

import dynamic from "next/dynamic";
import type { DataPoint } from "@/lib/dashboard/mock-data";

const LeafletMap = dynamic(() => import("./chart-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700">
      <div className="text-sm text-slate-500">กำลังโหลดแผนที่ GIS...</div>
    </div>
  ),
});

interface Props {
  data: DataPoint[];
  height?: number;
}

export function ChartMap({ data, height }: Props) {
  return (
    <div className="relative">
      <LeafletMap data={data} height={height} />
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            สูง
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            ปานกลาง
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            ต่ำ
          </span>
        </div>
        <span className="text-slate-400">
          OpenStreetMap · ขนาด = จำนวนเหตุการณ์ · ซูม/ลากได้
        </span>
      </div>
    </div>
  );
}
