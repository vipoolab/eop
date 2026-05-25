// /forms/new — สร้างแบบฟอร์มรายงานใหม่ (form builder)

import Link from "next/link";
import { ArrowLeft, LayoutList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FormBuilder } from "./form-builder";

export default function NewFormPage() {
  return (
    <div className="space-y-5">
      <Link
        href="/forms"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ คลังแบบฟอร์ม
      </Link>

      <PageHeader
        icon={LayoutList}
        eyebrow="สร้างแบบฟอร์มใหม่"
        title="ออกแบบแบบฟอร์มรายงาน"
        description="เพิ่มช่องกรอกและกำหนดประเภทข้อมูลที่ต้องการ — บันทึกแล้วสามารถนำไปเลือกใช้เป็น KPI เชิงคุณภาพในหนังสือสั่งการได้ทันที"
      />

      <FormBuilder />
    </div>
  );
}
