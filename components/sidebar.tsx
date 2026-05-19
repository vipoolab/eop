"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  FolderTree,
  Workflow,
  Glasses,
  Network,
  ScanText,
  ShieldCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
    torRef: "1.3 / 6.1",
  },
  {
    label: "Strategic Alignment",
    href: "/strategic",
    icon: Target,
    section: "ระบบ 1: ยุทธศาสตร์",
    torRef: "5.4.1",
  },
  {
    label: "AI Command Drafting",
    href: "/command-draft",
    icon: FileEdit,
    section: "ระบบ 2: วาระ",
    torRef: "5.4.2 / PoC 1",
  },
  {
    label: "Compliance Reports",
    href: "/compliance",
    icon: ShieldCheck,
    section: "ระบบ 3: กฎระเบียบ",
    torRef: "5.4.3",
  },
  {
    label: "Command Workflow",
    href: "/workflow",
    icon: Workflow,
    section: "ระบบ 4: สั่งการ",
    torRef: "5.4.4",
  },
  {
    label: "XR Command Center",
    href: "/xr",
    icon: Glasses,
    section: "ระบบ 5: XR",
    torRef: "5.4.5",
  },
  {
    label: "Document Classification",
    href: "/doc-class",
    icon: FolderTree,
    section: "ระบบ 6: Data & AI",
    torRef: "5.4.6 / PoC 2",
  },
  {
    label: "OCR Demo",
    href: "/ocr",
    icon: ScanText,
    section: "ระบบ 6: Data & AI",
    torRef: "6.10.3 / PoC 3",
  },
  {
    label: "Security & Audit",
    href: "/security",
    icon: Network,
    section: "ระบบ 7: Infrastructure",
    torRef: "5.4.7",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white font-bold">
          EOP
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">
            สยศ.ตร.
          </div>
          <div className="text-xs text-slate-500">
            Strategic Hub Demo
          </div>
        </div>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  TOR: {item.torRef}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mt-6 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="text-xs font-medium text-blue-900">Demo Notice</div>
        <p className="text-[11px] text-blue-700 mt-1 leading-snug">
          Prototype version — Mock data based on public ตร. reports & ก.พ.ร./ITA standards
        </p>
      </div>
    </aside>
  );
}
