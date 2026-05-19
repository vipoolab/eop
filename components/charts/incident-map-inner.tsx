"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { incidentLocations } from "@/lib/mock-data";

export default function IncidentMapInner() {
  const colorForSeverity = (s: number) => {
    if (s >= 8) return "#dc2626";
    if (s >= 6) return "#f59e0b";
    if (s >= 4) return "#3b82f6";
    return "#10b981";
  };

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidentLocations.map((loc, i) => (
          <CircleMarker
            key={i}
            center={[loc.lat, loc.lng]}
            radius={loc.severity * 1.4}
            pathOptions={{
              color: colorForSeverity(loc.severity),
              fillColor: colorForSeverity(loc.severity),
              fillOpacity: 0.45,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{loc.name}</div>
                <div className="text-slate-600">
                  เหตุการณ์: {loc.count} ครั้ง
                </div>
                <div className="text-slate-600">
                  ระดับความรุนแรง: {loc.severity}/10
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
