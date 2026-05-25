"use client";

// Bell icon in header — links to /inbox and shows badge with count

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export function InboxBell() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((j) => setCount(j.data?.totalActionable ?? 0))
      .catch(() => setCount(0));
  }, [pathname]);

  return (
    <Link
      href="/inbox"
      title={count ? `มี ${count} งานรอ` : "ไม่มีงานรอ"}
      className="relative h-9 w-9 rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
    >
      <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      {count !== null && count > 0 && (
        <span
          suppressHydrationWarning
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
