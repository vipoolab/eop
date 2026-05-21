// /reports/sitrep — Situation Report (TOR 6.4.7)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AlertOctagon, ArrowLeft, PlusCircle, Building2, Calendar } from "lucide-react";
import { SitrepCreateForm } from "./create-form";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

const FREQ_LABEL: Record<string, string> = {
  DAILY: "รายวัน",
  WEEKLY: "รายสัปดาห์",
  MONTHLY: "รายเดือน",
  QUARTERLY: "รายไตรมาส",
  YEARLY: "รายปี",
};

export default async function SitrepListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/");

  const sitreps = await prisma.situationReport.findMany({
    orderBy: { reportDate: "desc" },
    take: 50,
    include: {
      createdBy: { select: { name: true, rank: true } },
      unit: { select: { code: true, name: true } },
    },
  });

  const units = await prisma.unit.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายงาน & สรุป
      </Link>

      <PageHeader
        icon={AlertOctagon}
        eyebrow="Reports · SITREP"
        title="Situation Report (SITREP)"
        description="รายงานสถานการณ์ปัจจุบัน — TOR 6.4.7"
      />

      {(["ADMIN", "COMMANDER"].includes(role)) && (
        <SitrepCreateForm units={units} />
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          ประวัติ ({sitreps.length})
        </h2>
        {sitreps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <AlertOctagon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">ยังไม่มี SITREP</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sitreps.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
                    {s.reportNo}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {FREQ_LABEL[s.frequency] ?? s.frequency}
                  </span>
                  <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(s.reportDate).toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })}
                  </span>
                  {s.unit && (
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {s.unit.code} — {s.unit.name}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    โดย {s.createdBy.rank ?? ""} {s.createdBy.name}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">
                  {s.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
