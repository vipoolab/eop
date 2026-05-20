// Self-Assessment Checklist (PMQA style)

import { PageHeader } from "@/components/page-header";
import { ClipboardCheck, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

const CATEGORIES = [
  {
    name: "1. การกำกับดูแลองค์การ (Leadership)",
    items: [
      { text: "วิสัยทัศน์และเป้าหมายชัดเจน", done: true },
      { text: "แผนยุทธศาสตร์เชื่อมโยงกับยุทธศาสตร์ชาติ", done: true },
      { text: "ผู้บริหารระดับสูงทบทวนผลการดำเนินงานสม่ำเสมอ", done: true },
      { text: "ระบบประเมินผลผู้บริหารโปร่งใส", done: false },
    ],
  },
  {
    name: "2. การวางแผนยุทธศาสตร์ (Strategic Planning)",
    items: [
      { text: "มีแผนปฏิบัติราชการประจำปี", done: true },
      { text: "ถ่ายทอด KPI ลงสู่ระดับหน่วยงาน", done: true },
      { text: "ติดตามและประเมินผลแผน", done: true },
      { text: "ทบทวนแผนเมื่อสภาพแวดล้อมเปลี่ยน", done: false },
    ],
  },
  {
    name: "3. การให้ความสำคัญกับผู้รับบริการ (Customer Focus)",
    items: [
      { text: "ระบบรับฟังความเห็นประชาชน", done: true },
      { text: "การประเมินความพึงพอใจ", done: false },
      { text: "การแก้ไขข้อร้องเรียนตามกำหนดเวลา", done: true },
    ],
  },
  {
    name: "4. การวิเคราะห์และจัดการข้อมูล (Knowledge Mgmt)",
    items: [
      { text: "ฐานข้อมูลกลางที่บูรณาการ", done: true },
      { text: "เครื่องมือ Business Intelligence", done: true },
      { text: "การวิเคราะห์ Big Data + AI", done: true },
      { text: "การจัดการความรู้ภายในองค์กร", done: false },
    ],
  },
  {
    name: "5. การพัฒนาบุคลากร (HR Development)",
    items: [
      { text: "แผนพัฒนาบุคลากรประจำปี", done: true },
      { text: "ระบบประเมินผลงานที่เป็นธรรม", done: true },
      { text: "สวัสดิการและความปลอดภัย", done: false },
    ],
  },
  {
    name: "6. กระบวนการปฏิบัติงาน (Process Management)",
    items: [
      { text: "Workflow คำสั่ง 9 สถานะ", done: true },
      { text: "Document Control + Version", done: true },
      { text: "Audit Trail ครบถ้วน", done: true },
      { text: "ระบบ Disaster Recovery", done: false },
    ],
  },
];

export default function SelfAssessmentPage() {
  const totalItems = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);
  const doneItems = CATEGORIES.reduce(
    (sum, c) => sum + c.items.filter((i) => i.done).length,
    0
  );
  const pct = Math.round((doneItems / totalItems) * 100);
  const gaps = totalItems - doneItems;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={ClipboardCheck}
        eyebrow="Compliance & Reporting"
        title="การประเมินตนเอง"
        description="Checklist ตามมาตรฐาน PMQA — ตรวจสอบความพร้อมก่อนการประเมินจริง"
      />

      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ความพร้อมรวม
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
              {doneItems} / {totalItems}{" "}
              <span className="text-base font-normal text-slate-500">หัวข้อ</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#1e3a5f] tabular-nums">
              {pct}%
            </div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">
              พร้อมประเมิน
            </div>
          </div>
        </div>
        <div className="h-2 w-full rounded-sm bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#b8860b] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {gaps > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              เหลือ <strong>{gaps}</strong> หัวข้อ ที่ต้องดำเนินการก่อนการประเมิน
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((cat, idx) => {
          const catDone = cat.items.filter((i) => i.done).length;
          const catPct = Math.round((catDone / cat.items.length) * 100);
          return (
            <div key={idx} className="rounded-sm border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">{cat.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {catDone} / {cat.items.length}
                  </span>
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      catPct === 100
                        ? "text-emerald-700"
                        : catPct >= 60
                          ? "text-amber-700"
                          : "text-rose-700"
                    }`}
                  >
                    {catPct}%
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? "text-slate-700" : "text-slate-500"}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
