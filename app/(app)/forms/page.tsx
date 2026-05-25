// /forms — รายการแบบฟอร์มรายงานทั้งหมด

import Link from "next/link";
import { Plus, FileText, LayoutList, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listForms } from "@/lib/report-forms/store";
import { FORM_CATEGORIES } from "@/lib/report-forms/types";
import type { FormCategory } from "@/lib/report-forms/types";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<FormCategory, string> = {
  "การปราบปราม": "bg-red-100 text-red-800 border-red-200",
  "การสืบสวน": "bg-blue-100 text-blue-800 border-blue-200",
  "การป้องกัน": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "การจราจร": "bg-amber-100 text-amber-800 border-amber-200",
  "การอำนวยความสะดวก": "bg-purple-100 text-purple-800 border-purple-200",
  "การฝึกอบรม": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "ทั่วไป": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function FormsListPage() {
  const forms = listForms();
  const active = forms.filter((f) => f.isActive).length;

  const byCategory = FORM_CATEGORIES.map((cat) => ({
    cat,
    count: forms.filter((f) => f.category === cat).length,
  })).filter((x) => x.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutList}
        eyebrow="แบบฟอร์มรายงาน"
        title="คลังแบบฟอร์มรายงาน"
        description="แบบฟอร์มสำหรับใช้เป็นตัวชี้วัดเชิงคุณภาพในหนังสือสั่งการ — ผู้ดูแลระบบสามารถสร้างและจัดการแบบฟอร์มได้"
        actions={
          <Link
            href="/forms/new"
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            สร้างแบบฟอร์มใหม่
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="แบบฟอร์มทั้งหมด" value={forms.length} color="navy" />
        <StatCard label="เปิดใช้งาน" value={active} color="emerald" />
        <StatCard label="ปิดการใช้งาน" value={forms.length - active} color="slate" />
        <StatCard label="หมวดหมู่" value={byCategory.length} color="amber" />
      </div>

      {/* Category breakdown */}
      <div className="flex flex-wrap gap-2">
        {byCategory.map(({ cat, count }) => (
          <span
            key={cat}
            className={`text-xs font-semibold px-2.5 py-1 rounded-sm border ${CATEGORY_COLORS[cat as FormCategory]}`}
          >
            {cat} ({count})
          </span>
        ))}
      </div>

      {/* List */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            แบบฟอร์มทั้งหมด ({forms.length})
          </h2>
        </div>

        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-600">ยังไม่มีแบบฟอร์มในระบบ</div>
            <Link
              href="/forms/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] text-white text-sm px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              สร้างแบบฟอร์มแรก
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {forms.map((form) => (
              <li key={form.id} className="hover:bg-slate-50">
                <Link href={`/forms/${form.id}`} className="block px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-sm bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900">
                          {form.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${CATEGORY_COLORS[form.category]}`}
                        >
                          {form.category}
                        </span>
                        {form.isActive ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                            <XCircle className="h-3 w-3" />
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {form.description}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>{form.fields.length} ช่องกรอก</span>
                        <span>·</span>
                        <span>สร้างโดย {form.createdByName}</span>
                        <span>·</span>
                        <span>{new Date(form.createdAt).toLocaleDateString("th-TH")}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "navy" | "emerald" | "slate" | "amber";
}) {
  const colors = {
    navy: "bg-[#1e3a5f] text-white",
    emerald: "bg-emerald-600 text-white",
    slate: "bg-slate-400 text-white",
    amber: "bg-amber-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-sm flex items-center justify-center ${colors[color]}`}>
        <LayoutList className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
