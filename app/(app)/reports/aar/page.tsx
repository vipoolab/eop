// /reports/aar — After Action Review (TOR 6.4.4)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { RefreshCcw, ArrowLeft, Calendar, ListChecks } from "lucide-react";
import { AarCreateForm } from "./create-form";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function AarListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/");

  const aars = await prisma.afterActionReview.findMany({
    orderBy: { reviewDate: "desc" },
    take: 50,
    include: {
      facilitator: { select: { name: true, rank: true } },
      mission: { select: { code: true, title: true } },
      incident: { select: { code: true, title: true } },
      command: { select: { docNo: true, subject: true } },
    },
  });

  const recentMissions = await prisma.mission.findMany({
    where: { status: { in: ["CLOSED", "REPORTED"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, code: true, title: true },
    take: 30,
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
        icon={RefreshCcw}
        eyebrow="Reports · AAR"
        title="After Action Review"
        description="ทบทวนหลังภารกิจ — สิ่งที่ดี / สิ่งที่ต้องปรับ / บทเรียน · TOR 6.4.4"
      />

      {(["ADMIN", "COMMANDER"].includes(role)) && (
        <AarCreateForm missions={recentMissions} />
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          ประวัติ AAR ({aars.length})
        </h2>
        {aars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <RefreshCcw className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">ยังไม่มี AAR</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aars.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className="text-[11px] inline-flex items-center gap-1 text-slate-600">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.reviewDate).toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })}
                  </span>
                  {a.mission && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Mission: {a.mission.code}
                    </span>
                  )}
                  {a.incident && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Incident: {a.incident.code}
                    </span>
                  )}
                  {a.command && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                      Command: {a.command.docNo}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 ml-auto">
                    Facilitator: {a.facilitator.rank ?? ""} {a.facilitator.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                  <Block title="✓ สิ่งที่ดี" color="emerald" text={a.whatWorked} />
                  <Block title="✗ สิ่งที่ต้องปรับ" color="rose" text={a.whatDidNot} />
                  <Block title="📚 บทเรียน" color="amber" text={a.lessonsLearned} />
                </div>
                {a.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      ข้อเสนอแนะ
                    </div>
                    <ul className="text-[12px] text-slate-700 space-y-0.5 list-disc list-inside">
                      {a.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const BLOCK_COLORS = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  rose: "bg-rose-50 border-rose-200 text-rose-900",
  amber: "bg-amber-50 border-amber-200 text-amber-900",
} as const;

function Block({
  title,
  color,
  text,
}: {
  title: string;
  color: keyof typeof BLOCK_COLORS;
  text: string;
}) {
  return (
    <div className={`rounded-md border ${BLOCK_COLORS[color]} p-2.5`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-80">
        {title}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
  );
}
