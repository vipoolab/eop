import { Construction, ArrowRight } from "lucide-react";
import { TorBanner } from "@/components/tor-banner";

interface PlaceholderPageProps {
  title: string;
  torRefs: string | string[];
  system?: string;
  description: string;
  pocNumber?: 1 | 2 | 3 | 4;
  live?: boolean;
  /** Features ที่จะมีในหน้านี้ (จาก TOR) */
  features?: string[];
  /** Implementation status */
  status?: "scaffolded" | "in-progress" | "live";
  /** Day ที่จะทำในแผน 7 วัน */
  scheduledDay?: number;
}

/**
 * Template สำหรับหน้าที่ยังไม่ได้ implement
 * แสดง:
 * - TOR Banner
 * - ชื่อหน้า + คำอธิบาย
 * - Feature list ตาม TOR
 * - Status + Day scheduled
 */
export function PlaceholderPage({
  title,
  torRefs,
  system,
  description,
  pocNumber,
  live,
  features = [],
  status = "scaffolded",
  scheduledDay,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <TorBanner
        torRefs={torRefs}
        system={system}
        description={description}
        pocNumber={pocNumber}
        live={live}
      />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <StatusBadge status={status} scheduledDay={scheduledDay} />
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
            ฟีเจอร์ตาม TOR
          </h3>
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coming soon banner */}
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Construction className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700">
          กำลังพัฒนา (Scaffolded UI)
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          หน้านี้รองรับโครงสร้างตาม TOR ครบแล้ว —{" "}
          {scheduledDay
            ? `Implementation scheduled in Day ${scheduledDay} ตาม Development Plan`
            : "Implementation จะอยู่ใน Phase ถัดไป"}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  scheduledDay,
}: {
  status: "scaffolded" | "in-progress" | "live";
  scheduledDay?: number;
}) {
  const config = {
    scaffolded: {
      label: "Scaffolded",
      className: "bg-slate-100 text-slate-700 border-slate-300",
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700 border-blue-300",
    },
    live: {
      label: "Live ⭐",
      className: "bg-green-100 text-green-700 border-green-300",
    },
  };
  const c = config[status];
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${c.className}`}
      >
        {c.label}
      </span>
      {scheduledDay && (
        <span className="text-[10px] text-slate-500">Day {scheduledDay}</span>
      )}
    </div>
  );
}
