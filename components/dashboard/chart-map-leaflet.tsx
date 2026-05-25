"use client";

// Real GIS map using Leaflet + OpenStreetMap tiles.
// Lazy-rendered (no SSR) because Leaflet needs window.

import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DataPoint } from "@/lib/dashboard/mock-data";

interface ProvinceAgg {
  name: string;
  lat: number;
  lng: number;
  incidents: number;
  commands: number;
  arrests: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

// Center of Thailand
const THAILAND_CENTER: [number, number] = [13.736, 100.523];
const DEFAULT_ZOOM = 6;

export default function ChartMapLeaflet({ data, height = 500 }: Props) {
  // Fix default marker icon path (Leaflet's known issue with Next.js)
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const provinces: ProvinceAgg[] = useMemo(() => {
    const buckets = new Map<string, ProvinceAgg>();
    for (const d of data) {
      const key = d.province;
      const b = buckets.get(key) ?? {
        name: d.province,
        lat: d.provinceLat,
        lng: d.provinceLng,
        incidents: 0,
        commands: 0,
        arrests: 0,
      };
      b.incidents += d.incidents;
      b.commands += d.commandsIssued;
      b.arrests += d.arrests;
      buckets.set(key, b);
    }
    return Array.from(buckets.values()).sort((a, b) => b.incidents - a.incidents);
  }, [data]);

  const maxIncidents = provinces.reduce((m, p) => Math.max(m, p.incidents), 1);

  return (
    <div style={{ height, width: "100%" }} className="rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700">
      <MapContainer
        center={THAILAND_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Real OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />

        {/* Province circle markers — radius scales with incidents */}
        {provinces.map((p) => {
          const intensity = p.incidents / maxIncidents;
          // Radius in pixels: 6-30
          const radius = 6 + intensity * 24;
          const color =
            intensity > 0.66 ? "#dc2626" : intensity > 0.33 ? "#f59e0b" : "#3b82f6";

          return (
            <CircleMarker
              key={p.name}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: "#ffffff",
                weight: 2,
                fillOpacity: 0.7,
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -radius / 2]} permanent={intensity > 0.5}>
                <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div>เหตุการณ์: <strong>{p.incidents.toLocaleString()}</strong></div>
                  <div>คำสั่ง: {p.commands.toLocaleString()}</div>
                  <div>ผู้ถูกจับ: {p.arrests.toLocaleString()}</div>
                </div>
              </LeafletTooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 right-4 z-[400] rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-md text-[10px] text-slate-700 dark:text-slate-300 hidden">
        <div className="font-bold mb-1">ความหนาแน่นเหตุการณ์</div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: "#dc2626" }} />
            สูง
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />
            กลาง
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: "#3b82f6" }} />
            ต่ำ
          </span>
        </div>
      </div>
    </div>
  );
}
