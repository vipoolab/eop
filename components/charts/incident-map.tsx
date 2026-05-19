"use client";

import dynamic from "next/dynamic";

// Leaflet must be client-side only — wrap with dynamic import
const Map = dynamic(() => import("./incident-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-lg text-sm text-slate-500">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export function IncidentMap() {
  return <Map />;
}
