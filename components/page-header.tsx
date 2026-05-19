// Page header component — clean, enterprise-style
// Replaces the previous TorBanner. TOR refs are kept only in source comments.

import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  /** Section/module name (e.g. "Command & Operation") */
  eyebrow?: string;
  /** Page title */
  title: string;
  /** Optional subtitle / description */
  description?: string;
  /** Optional icon on the left */
  icon?: LucideIcon;
  /** Marks this page as having real AI integration */
  live?: boolean;
  /** Action area on the right (buttons etc.) */
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
    <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200/70">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">
              {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 leading-tight">
              {title}
            </h1>
            {live && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live AI
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
