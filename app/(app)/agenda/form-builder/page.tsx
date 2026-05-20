// Dynamic Form Builder — Drag & Drop mockup

import { PageHeader } from "@/components/page-header";
import {
  FormInput,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  Paperclip,
  GripVertical,
  Plus,
  Eye,
} from "lucide-react";

const FIELD_TYPES = [
  { icon: Type, label: "ข้อความ", desc: "Text input" },
  { icon: Hash, label: "ตัวเลข", desc: "Number" },
  { icon: Calendar, label: "วันที่", desc: "Date picker" },
  { icon: ChevronDown, label: "Dropdown", desc: "Select" },
  { icon: Paperclip, label: "ไฟล์", desc: "Attachment" },
];

const TEMPLATES = [
  { name: "รายงานผลการปฏิบัติงาน รายไตรมาส", fields: 12 },
  { name: "แบบสำรวจอัตรากำลัง", fields: 8 },
  { name: "แบบประเมิน ก.พ.ร.", fields: 15 },
  { name: "แบบรายงานเหตุการณ์", fields: 10 },
  { name: "แบบฟอร์มขอรับสวัสดิการ", fields: 14 },
  { name: "แบบรายงานคดี", fields: 18 },
];

export default function FormBuilderPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={FormInput}
        eyebrow="Agenda-based"
        title="Dynamic Form Builder"
        description="สร้างแบบฟอร์มราชการแบบ No-Code · Drag & Drop · ใช้งานได้ทันทีโดยไม่ต้องเขียนโค้ด"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left: Field palette */}
        <div className="rounded-sm border border-slate-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            ลากฟิลด์เข้าฟอร์ม
          </h3>
          <div className="space-y-1.5">
            {FIELD_TYPES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-sm border border-slate-200 bg-slate-50 hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f]/30 cursor-grab transition-colors"
                >
                  <GripVertical className="h-3.5 w-3.5 text-slate-300" />
                  <Icon className="h-4 w-4 text-slate-600" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle: Form canvas (mock) */}
        <div className="lg:col-span-2 rounded-sm border-2 border-dashed border-[#1e3a5f]/30 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              แบบรายงานผลการปฏิบัติงาน รายไตรมาส
            </h3>
            <span className="text-[11px] text-slate-500">DRAFT</span>
          </div>

          <div className="space-y-3">
            <MockField icon={Type} label="ชื่อหน่วยปฏิบัติ" required />
            <MockField icon={Calendar} label="วันที่รายงาน" required />
            <MockField icon={ChevronDown} label="ไตรมาส" required />
            <MockField icon={Type} label="ผลการดำเนินงานโดยสรุป" textarea />
            <MockField icon={Hash} label="จำนวนคดีที่ดำเนินการ" />
            <MockField icon={Paperclip} label="เอกสารแนบ (ภาพ/PDF)" />

            <button className="w-full rounded-sm border-2 border-dashed border-slate-300 hover:border-[#1e3a5f]/50 px-3 py-3 text-xs text-slate-500 hover:text-[#1e3a5f] inline-flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              เพิ่มฟิลด์ใหม่
            </button>
          </div>
        </div>

        {/* Right: Templates */}
        <div className="rounded-sm border border-slate-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            เทมเพลตพร้อมใช้
          </h3>
          <div className="space-y-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                className="w-full text-left rounded-sm border border-slate-200 bg-white hover:border-[#1e3a5f]/30 hover:bg-slate-50 p-2.5 transition-colors"
              >
                <div className="text-xs font-medium text-slate-900 line-clamp-2 mb-1">
                  {t.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {t.fields} ฟิลด์
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-4 text-xs text-slate-700 leading-relaxed">
        <div className="flex items-start gap-2">
          <Eye className="h-4 w-4 text-[#b8860b] mt-0.5 shrink-0" />
          <span>
            <strong className="text-[#b8860b]">No-Code Builder</strong> — ผู้ดูแลหน่วยงาน
            สามารถสร้างแบบฟอร์มใหม่ในเวลา 5 นาที โดยไม่ต้องเขียนโค้ด ใช้งานพร้อมระบบ
            Workflow + Audit Log ของ EOP ทันที
          </span>
        </div>
      </div>
    </div>
  );
}

function MockField({
  icon: Icon,
  label,
  required,
  textarea,
}: {
  icon: typeof Type;
  label: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50/50 px-3 py-2 hover:border-[#1e3a5f]/30 hover:bg-white">
      <div className="flex items-center gap-2 mb-1.5">
        <GripVertical className="h-3 w-3 text-slate-300" />
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </span>
      </div>
      <div
        className={`rounded-sm border border-slate-200 bg-white ${
          textarea ? "h-16" : "h-7"
        }`}
      />
    </div>
  );
}
