"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";

interface Props {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  /** If provided, show maximize icon → opens chart in fullscreen embed mode */
  embedHref?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, icon: Icon, sub, embedHref, children }: Props) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#b8860b]" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {sub && <span className="text-[10px] text-slate-500 ml-2">{sub}</span>}
        {embedHref && (
          <Link
            href={embedHref}
            target="_blank"
            className="ml-auto text-slate-400 hover:text-[#1e3a5f] dark:hover:text-amber-400 transition-colors"
            title="ขยายเต็มจอ (สำหรับ XR/VR)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
