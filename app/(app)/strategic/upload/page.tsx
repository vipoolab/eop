// /strategic/upload — อัปโหลด PDF + AI parse

import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listDocuments } from "@/lib/strategic/store";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default function StrategicUploadPage() {
  const allDocs = listDocuments();
  const nsDoc = allDocs.find((d) => d.level === 1) ?? null;
  const masterPlans = allDocs.filter((d) => d.level === 2);

  return (
    <div className="space-y-6">
      <Link
        href="/strategic"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ คลังแผนยุทธศาสตร์
      </Link>

      <PageHeader
        icon={Upload}
        eyebrow="คลังแผนยุทธศาสตร์ → อัปโหลด"
        title="อัปโหลดแผนใหม่"
        description="เลือก PDF ของ ยุทธศาสตร์ชาติ / แผนแม่บท / แผนปฏิบัติราชการ — AI Engine จะอ่านและดึงโครงสร้างเป็นลำดับชั้นโดยอัตโนมัติ"
        live
      />

      <UploadForm
        nationalStrategy={nsDoc}
        masterPlans={masterPlans.map((d) => ({
          id: d.id,
          title: d.title,
        }))}
      />
    </div>
  );
}
