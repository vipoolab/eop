// Create new Compliance Report

import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { NewReportForm } from "./new-report-form";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  await requireRole(["ADMIN", "COMMANDER", "STAFF"]);

  const [templates, units] = await Promise.all([
    prisma.complianceTemplate.findMany({
      where: { active: true },
      orderBy: [{ standard: "asc" }, { effectiveDate: "desc" }],
      include: { _count: { select: { items: true } } },
    }),
    prisma.unit.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, level: true },
      orderBy: [{ level: "asc" }, { code: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/compliance/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <PageHeader
        icon={ShieldCheck}
        eyebrow="New Report"
        title="สร้างรายงานใหม่"
        description="เลือกมาตรฐาน + ช่วงเวลา + หน่วยงาน — ระบบจะสร้างรายงานพร้อมรายการคำถาม"
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewReportForm
          templates={templates.map((t) => ({
            id: t.id,
            standard: t.standard,
            code: t.code,
            name: t.name,
            version: t.version,
            itemCount: t._count.items,
          }))}
          units={units}
        />
      </div>
    </div>
  );
}
