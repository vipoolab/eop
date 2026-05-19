// Page header — formal Thai government style
// Note: TOR refs are intentionally NOT rendered here.

import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  live?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  live,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-[#1e3a5f]/10">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1e3a5f] text-white border border-[#142a45]">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b8860b] mb-1">
              {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 leading-tight tracking-tight">
              {title}
            </h1>
            {live && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-[#b8860b]/10 border border-[#b8860b]/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#92400e]">
                AI Powered
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
