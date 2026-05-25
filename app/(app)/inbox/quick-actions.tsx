"use client";

// Inline quick actions in inbox rows.
// Approval shows signature modal; others perform single transition.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  PlayCircle,
  FileCheck,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { InboxCategory } from "@/lib/commands/inbox";

interface Props {
  category: InboxCategory;
  commandId: string;
  unitId: string;
}

export function InboxQuickActions({ category, commandId, unitId }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function ack() {
    setWorking(true);
    try {
      await fetch(`/api/commands/${commandId}/units/${unitId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "acknowledge" }),
      });
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  async function start() {
    setWorking(true);
    try {
      await fetch(`/api/commands/${commandId}/units/${unitId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  if (category === "PENDING_APPROVAL") {
    // Approval requires signature confirmation → just link to detail
    return (
      <a
        href={`/commands/${commandId}`}
        className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5"
      >
        <Sparkles className="h-3 w-3" />
        เปิดเพื่ออนุมัติ + ลงนาม
      </a>
    );
  }

  if (category === "PENDING_ACK") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <a
          href={`/commands/${commandId}/cascade`}
          className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white font-bold px-3 py-1.5"
        >
          <Sparkles className="h-3 w-3" />
          รับทราบ + มอบหมายต่อ
        </a>
        <button
          type="button"
          suppressHydrationWarning
          onClick={ack}
          disabled={working}
          className="inline-flex items-center gap-1.5 text-xs rounded-sm border border-blue-300 hover:border-blue-500 text-blue-700 dark:text-blue-300 font-medium px-3 py-1.5 disabled:opacity-40"
        >
          <CheckCircle2 className="h-3 w-3" />
          รับทราบ
        </button>
      </div>
    );
  }

  if (category === "PENDING_START") {
    return (
      <button
        type="button"
        suppressHydrationWarning
        onClick={start}
        disabled={working}
        className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 disabled:opacity-40"
      >
        <PlayCircle className="h-3 w-3" />
        เริ่มปฏิบัติ
      </button>
    );
  }

  if (category === "PENDING_REPORT") {
    return (
      <a
        href={`/commands/${commandId}`}
        className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-[#b8860b] hover:bg-[#92400e] text-white font-medium px-3 py-1.5"
      >
        <FileCheck className="h-3 w-3" />
        ส่งผลรายงาน
      </a>
    );
  }

  if (category === "PENDING_CLOSE") {
    return (
      <a
        href={`/commands/${commandId}`}
        className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-slate-700 hover:bg-slate-800 text-white font-medium px-3 py-1.5"
      >
        <Lock className="h-3 w-3" />
        เปิดเพื่อปิดงาน
      </a>
    );
  }

  if (category === "MY_DRAFT") {
    return (
      <a
        href={`/commands/${commandId}`}
        className="inline-flex items-center gap-1.5 text-xs rounded-sm bg-slate-600 hover:bg-slate-700 text-white font-medium px-3 py-1.5"
      >
        <ArrowRight className="h-3 w-3" />
        เปิดร่าง
      </a>
    );
  }

  // MONITORING — no inline action, link only
  return null;
}
