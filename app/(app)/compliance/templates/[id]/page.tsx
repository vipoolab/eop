// /compliance/templates/[id] — แก้/clone template

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { FileText, ArrowLeft } from "lucide-react";
import {
  STANDARD_LABELS,
  type ComplianceStandard,
} from "@/features/compliance/types";
import { TemplateEditor } from "../template-editor";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  const { id } = await params;

  const tpl = await prisma.complianceTemplate.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      _count: { select: { reports: true } },
    },
  });
  if (!tpl) notFound();

  // Read-only for non-manager roles — but for now redirect (will refine later if needed)
  if (!["ADMIN", "COMMANDER"].includes(role)) {
    redirect("/compliance/templates");
  }

  const std = tpl.standard as ComplianceStandard;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/compliance/templates"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายการ
      </Link>

      <PageHeader
        icon={FileText}
        eyebrow={`${STANDARD_LABELS[std]} · ${tpl.code} · v${tpl.version}`}
        title={tpl.name}
        description={`มีผลตั้งแต่ ${new Date(tpl.effectiveDate).toLocaleDateString("th-TH", { dateStyle: "medium" })} · ใช้ในรายงาน ${tpl._count.reports} ฉบับ`}
      />

      <TemplateEditor
        initial={{
          id: tpl.id,
          standard: std,
          code: tpl.code,
          name: tpl.name,
          version: tpl.version,
          effectiveDate: tpl.effectiveDate.toISOString(),
          active: tpl.active,
          reportCount: tpl._count.reports,
          items: tpl.items.map((it, i) => ({
            id: it.id,
            localId: `db-${it.id}`,
            code: it.code,
            category: it.category,
            question: it.question,
            weight: it.weight,
            evidenceRequired: it.evidenceRequired,
          })),
        }}
      />
    </div>
  );
}
