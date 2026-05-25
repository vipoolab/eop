"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

export function FormToggleActive({
  formId,
  isActive,
}: {
  formId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);

  async function toggle() {
    const next = !active;
    setActive(next);
    await fetch(`/api/report-forms/${formId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-sm border text-sm font-medium px-3 py-2 transition-colors ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {active ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          เปิดใช้งาน
        </>
      ) : (
        <>
          <XCircle className="h-3.5 w-3.5" />
          ปิดการใช้งาน
        </>
      )}
    </button>
  );
}
