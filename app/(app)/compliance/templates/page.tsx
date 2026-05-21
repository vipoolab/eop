// /compliance/templates — list + manage templates (TOR ๓.๑ "สร้าง")

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  FileText,
  PlusCircle,
  ArrowLeft,
  Calendar,
  Hash,
  ListChecks,
} from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_COLORS,
  type ComplianceStandard,
} from "@/features/compliance/types";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function TemplatesListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;

  const templates = await prisma.complianceTemplate.findMany({
    orderBy: [{ active: "desc" }, { standard: "asc" }, { effectiveDate: "desc" }],
    include: { _count: { select: { items: true, reports: true } } },
  });

  // Group by standard
  const byStd = new Map<ComplianceStandard, typeof templates>();
  for (const t of templates) {
    const std = t.standard as ComplianceStandard;
    if (!byStd.has(std)) byStd.set(std, []);
    byStd.get(std)!.push(t);
  }

  const canManage = ["ADMIN", "COMMANDER"].includes(role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/compliance"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังภาพรวม
      </Link>

      <PageHeader
        icon={FileText}
        eyebrow="Compliance · Templates"
        title="แบบฟอร์มมาตรฐาน"
        description={`${templates.length} template — สร้าง/แก้/clone สำหรับใช้เปิดรายงานในแต่ละปี`}
        actions={
          canManage && (
            <Link
              href="/compliance/templates/new"
              className="inline-flex items-center gap-1 text-sm rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700"
            >
              <PlusCircle className="h-4 w-4" />
              สร้าง Template ใหม่
            </Link>
          )
        }
      />

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">ยังไม่มี template</p>
          {canManage && (
            <Link
              href="/compliance/templates/new"
              className="inline-flex items-center gap-1 text-sm rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700"
            >
              <PlusCircle className="h-4 w-4" />
              สร้าง Template แรก
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byStd.entries()).map(([std, items]) => (
            <div key={std}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-700">
                  {STANDARD_LABELS[std]}
                </h2>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}
                >
                  {items.length} template
                </span>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/compliance/templates/${t.id}`}
                    className={`block rounded-lg border ${
                      t.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
                    } p-4 hover:border-slate-300 hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {t.name}
                          </h3>
                          {!t.active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                              ปิดใช้งาน
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {t.code}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            v{t.version} · มีผล{" "}
                            {new Date(t.effectiveDate).toLocaleDateString("th-TH", {
                              dateStyle: "medium",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ListChecks className="h-3 w-3" />
                            {t._count.items} ข้อ
                          </span>
                          <span className="inline-flex items-center gap-1">
                            ใช้แล้ว <strong>{t._count.reports}</strong> รายงาน
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
