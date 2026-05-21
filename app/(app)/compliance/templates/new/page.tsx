// /compliance/templates/new — สร้าง template ใหม่

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { FileText, ArrowLeft } from "lucide-react";
import { TemplateEditor } from "../template-editor";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER"].includes(role)) {
    redirect("/compliance/templates");
  }

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
        eyebrow="Compliance · Templates"
        title="สร้าง Template ใหม่"
        description="กำหนดมาตรฐาน + Checklist รายข้อ สำหรับใช้เปิดรายงานในแต่ละหน่วย/ปี"
      />

      <TemplateEditor
        initial={{
          standard: "GOR_POR_ROR",
          code: "",
          name: "",
          version: "1.0",
          effectiveDate: new Date().toISOString(),
          active: true,
          items: [],
        }}
      />
    </div>
  );
}
