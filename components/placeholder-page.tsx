// Generic placeholder page for scaffolded routes
// Note: TOR refs are kept in source code for traceability, not displayed.

import { Construction, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface PlaceholderPageProps {
  title: string;
  /** Section / module name shown as eyebrow */
  system?: string;
  /** TOR refs — accepted for backward compatibility but NOT rendered */
  torRefs?: string | string[];
  description: string;
  pocNumber?: 1 | 2 | 3 | 4;
  live?: boolean;
  /** Planned features for this page */
  features?: string[];
  status?: "scaffolded" | "in-progress" | "live";
  scheduledDay?: number;
}

export function PlaceholderPage({
  title,
  system,
  description,
  live,
  features = [],
  status = "scaffolded",
  scheduledDay,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        eyebrow={system}
        title={title}
        description={description}
        live={live}
        actions={<StatusBadge status={status} scheduledDay={scheduledDay} />}
      />

      {/* Features */}
      {features.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Planned features
          </h3>
          <ul className="space-y-2.5">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coming soon */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm mb-3">
          <Construction className="h-5 w-5 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          กำลังพัฒนา
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          {scheduledDay
            ? `Implementation พร้อมใช้งานใน Day ${scheduledDay} ของแผนพัฒนา`
            : "หน้านี้จะถูกพัฒนาในเฟสถัดไป"}
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
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    live: {
      label: "Live",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };
  const c = config[status];
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${c.className}`}
      >
        {c.label}
      </span>
      {scheduledDay && (
        <span className="text-[10px] text-slate-400">Day {scheduledDay}</span>
      )}
    </div>
  );
}
