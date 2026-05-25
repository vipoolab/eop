// /forms/[id] — แสดงรายละเอียดและ preview แบบฟอร์ม

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Pencil,
  CheckCircle2,
  XCircle,
  Star,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getForm } from "@/lib/report-forms/store";
import type { FieldType } from "@/lib/report-forms/types";
import { FIELD_TYPE_LABELS } from "@/lib/report-forms/types";
import { FormToggleActive } from "./form-toggle-active";

export const dynamic = "force-dynamic";

const FIELD_ICONS: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  text: AlignLeft,
  textarea: AlignLeft,
  number: Hash,
  select: ChevronDown,
  radio: Circle,
  checkbox: CheckSquare,
  date: Calendar,
  rating: Star,
};

const FIELD_ICON_COLORS: Record<FieldType, string> = {
  text: "text-blue-500",
  textarea: "text-blue-500",
  number: "text-emerald-500",
  select: "text-amber-500",
  radio: "text-purple-500",
  checkbox: "text-purple-500",
  date: "text-cyan-500",
  rating: "text-amber-500",
};

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = getForm(id);
  if (!form) notFound();

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
        icon={FileText}
        eyebrow={`แบบฟอร์ม · ${form.category}`}
        title={form.name}
        description={form.description}
        actions={
          <div className="flex items-center gap-2">
            <FormToggleActive formId={form.id} isActive={form.isActive} />
            <Link
              href={`/forms/${form.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              แก้ไข
            </Link>
          </div>
        }
      />

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <MetaCard label="หมวดหมู่" value={form.category} />
        <MetaCard label="จำนวนช่องกรอก" value={`${form.fields.length} ช่อง`} />
        <MetaCard
          label="สถานะ"
          value={
            form.isActive ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                เปิดใช้งาน
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                <XCircle className="h-3.5 w-3.5" />
                ปิดการใช้งาน
              </span>
            )
          }
        />
        <MetaCard label="สร้างโดย" value={form.createdByName} />
      </div>

      {/* Preview */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#b8860b]" />
          <h2 className="font-semibold text-slate-900 text-sm">
            ตัวอย่างแบบฟอร์ม (Preview)
          </h2>
          <span className="text-[11px] text-slate-400 ml-auto">
            ดูเฉพาะโครงสร้าง — ไม่สามารถกรอกได้จากหน้านี้
          </span>
        </div>

        <div className="p-5 space-y-4">
          {form.fields.map((field, idx) => {
            const Icon = FIELD_ICONS[field.type];
            const iconColor = FIELD_ICON_COLORS[field.type];

            return (
              <div key={field.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                  <label className="text-sm font-semibold text-slate-800">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                    {FIELD_TYPE_LABELS[field.type]}
                  </span>
                </div>

                {field.helpText && (
                  <p className="text-[11px] text-slate-500 ml-7">{field.helpText}</p>
                )}

                <div className="ml-7">
                  {field.type === "text" && (
                    <div className="h-9 rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 flex items-center text-xs text-slate-400">
                      {field.placeholder ?? "ข้อความสั้น"}
                    </div>
                  )}
                  {field.type === "textarea" && (
                    <div className="h-16 rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                      {field.placeholder ?? "ข้อความยาว"}
                    </div>
                  )}
                  {field.type === "number" && (
                    <div className="h-9 w-36 rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 flex items-center text-xs text-slate-400">
                      {field.validation?.min ?? 0} – {field.validation?.max ?? "∞"}
                    </div>
                  )}
                  {field.type === "date" && (
                    <div className="h-9 w-40 rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      วว/ดด/ปปปป
                    </div>
                  )}
                  {field.type === "select" && (
                    <div className="h-9 w-64 rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 flex items-center justify-between text-xs text-slate-400">
                      <span>เลือกจากรายการ...</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {(field.type === "radio" || field.type === "checkbox") &&
                    field.options && (
                      <div className="flex flex-col gap-1">
                        {field.options.map((opt) => (
                          <div key={opt} className="flex items-center gap-2 text-sm text-slate-600">
                            <div
                              className={`h-3.5 w-3.5 rounded-${field.type === "radio" ? "full" : "sm"} border border-slate-300 bg-slate-50`}
                            />
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  {field.type === "rating" && (
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="h-8 w-8 rounded-sm border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400"
                        >
                          {n}
                        </div>
                      ))}
                      <span className="text-[11px] text-slate-400 ml-1">ดาว</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}
