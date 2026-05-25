"use client";

import { Sparkles, Lightbulb, KeyRound, Database, FileText, Hash } from "lucide-react";

export interface IntentFields {
  keywords: string;
  baseInfo: string;
  context: string;
}

interface Props {
  fields: IntentFields;
  onChange: (next: IntentFields) => void;
  onNext: () => void;
}

const EXAMPLES: { label: string; fields: IntentFields }[] = [
  {
    label: "ปราบปรามแก๊งคอลเซ็นเตอร์ภาคเหนือ",
    fields: {
      keywords: "ปราบปรามแก๊งคอลเซ็นเตอร์, ภาค ๕, จับกุม, เครือข่ายข้ามชาติ",
      baseInfo:
        "พื้นที่เป้าหมาย: ภ.จว.เชียงใหม่, เชียงราย, ลำปาง, ลำพูน\nเป้าหมายจับกุม: ๒๐๐ ราย ภายใน ๓๐ วัน\nหน่วยร่วม: บก.สส.ภาค ๕, DSI, ปคบ.",
      context:
        "สถานการณ์การหลอกลวงทางโทรศัพท์โดยแก๊งคอลเซ็นเตอร์ในพื้นที่ภาคเหนือมีแนวโน้มเพิ่มขึ้นต่อเนื่อง โดยเฉพาะการหลอกลงทุนคริปโตและการแอบอ้างเป็นเจ้าหน้าที่รัฐ ส่งผลกระทบต่อประชาชนเป็นวงกว้าง สอดคล้องกับนโยบาย ผบ.ตร. ข้อที่ ๓ ปราบปรามอาชญากรรมรุนแรง",
    },
  },
  {
    label: "ตั้งจุดตรวจช่วงเทศกาลปีใหม่",
    fields: {
      keywords: "จุดตรวจจราจร, ปีใหม่, ลดอุบัติเหตุ, เมาแล้วขับ",
      baseInfo:
        "ช่วงเวลา: ๒๘ ธ.ค. – ๓ ม.ค. (๗ วันอันตราย)\nหน่วยรับ: ทุก สภ./สน. ทั่วประเทศ\nเป้า: ๑,๐๐๐ จุดทั่วประเทศ ลดอุบัติเหตุ ๓๐%",
      context:
        "ช่วงเทศกาลปีใหม่มีการเดินทางของประชาชนเป็นจำนวนมาก ปีที่ผ่านมามีอุบัติเหตุ ๒,๔๐๐ ครั้ง เสียชีวิต ๓๐๐ ราย โดย ๖๐% เป็นเหตุเมาแล้วขับ ตามนโยบาย ๗ วันอันตราย ของรัฐบาล",
    },
  },
  {
    label: "ดูแลความปลอดภัยนักท่องเที่ยวภาคใต้",
    fields: {
      keywords: "Tourism Police, ภาคใต้, High Season, ความปลอดภัยนักท่องเที่ยว",
      baseInfo:
        "พื้นที่: ภ.จว.ภูเก็ต กระบี่ พังงา\nระยะเวลา: ๑ ธ.ค. – ๒๘ ก.พ.\nหน่วยร่วม: Tourism Police, ตม., ตชด.\nเป้า: ลดคดีเกี่ยวข้องนักท่องเที่ยว ๒๐%",
      context:
        "ช่วง High Season มีนักท่องเที่ยวต่างชาติเข้ามาในพื้นที่ภาคใต้กว่า ๒ ล้านคน/เดือน คดีลักทรัพย์ ฉ้อโกง และการเอาเปรียบนักท่องเที่ยวมีแนวโน้มสูง สอดคล้องกับนโยบาย Soft Power และการส่งเสริมการท่องเที่ยวของรัฐบาล",
    },
  },
];

export function IntentStep({ fields, onChange }: Props) {
  function patch(p: Partial<IntentFields>) {
    onChange({ ...fields, ...p });
  }

  const totalChars = fields.keywords.length + fields.baseInfo.length + fields.context.length;
  const filledCount = [fields.keywords, fields.baseInfo, fields.context].filter((x) => x.trim()).length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
          <span>ขั้นที่ ๑</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
            PoC INPUT FORMAT
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ใส่ข้อมูล ๓ ส่วน — AI จะร่างหนังสือสั่งการให้
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          AI Engine จะวิเคราะห์ข้อมูล ๓ ส่วน → ร่างหนังสือราชการที่มีองค์ประกอบครบ ๕ ข้อ
          ตามเกณฑ์ PoC + จับคู่กับยุทธศาสตร์ ๓ ระดับ
        </p>
      </div>

      <div className="space-y-4">
        {/* Field 1: Keywords */}
        <FieldCard
          icon={KeyRound}
          accent="navy"
          step="๑"
          label="คำสำคัญ (Keywords)"
          hint="หัวข้อหลัก, action, พื้นที่, กลุ่มเป้าหมาย — คั่นด้วยจุลภาค"
        >
          <input
            type="text"
            value={fields.keywords}
            onChange={(e) => patch({ keywords: e.target.value })}
            placeholder="เช่น: ปราบปรามคอลเซ็นเตอร์, ภาคเหนือ, จับกุม"
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#1e3a5f] dark:focus:border-amber-400 focus:outline-none"
          />
          <div className="text-[10px] text-slate-400 mt-1">{fields.keywords.length} ตัวอักษร</div>
        </FieldCard>

        {/* Field 2: Base Info */}
        <FieldCard
          icon={Database}
          accent="gold"
          step="๒"
          label="ข้อมูลตั้งต้น (Base Info)"
          hint="ตัวเลข, ระยะเวลา, หน่วยร่วม, เป้าหมายเชิงปริมาณ — สิ่งที่ AI ควรอ้างอิงในร่าง"
        >
          <textarea
            value={fields.baseInfo}
            onChange={(e) => patch({ baseInfo: e.target.value })}
            placeholder="เช่น:&#10;พื้นที่: ภ.จว.เชียงใหม่, เชียงราย&#10;เป้า: ๒๐๐ ราย ภายใน ๓๐ วัน&#10;หน่วยร่วม: DSI, ปคบ."
            rows={4}
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#1e3a5f] dark:focus:border-amber-400 focus:outline-none resize-y leading-relaxed"
          />
          <div className="text-[10px] text-slate-400 mt-1">{fields.baseInfo.length} ตัวอักษร</div>
        </FieldCard>

        {/* Field 3: Context */}
        <FieldCard
          icon={FileText}
          accent="slate"
          step="๓"
          label="บริบทที่เกี่ยวข้อง (Context)"
          hint="สถานการณ์ที่มา, นโยบายต้นทาง, เหตุผลทางยุทธศาสตร์ — เป็นเรื่องเล่าให้ AI"
        >
          <textarea
            value={fields.context}
            onChange={(e) => patch({ context: e.target.value })}
            placeholder="เช่น: สถานการณ์การหลอกลวงทางโทรศัพท์มีแนวโน้มเพิ่มขึ้น ส่งผลกระทบต่อประชาชน ตามนโยบาย ผบ.ตร. ข้อที่ ๓ ปราบปรามอาชญากรรมรุนแรง..."
            rows={4}
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#1e3a5f] dark:focus:border-amber-400 focus:outline-none resize-y leading-relaxed"
          />
          <div className="text-[10px] text-slate-400 mt-1">{fields.context.length} ตัวอักษร</div>
        </FieldCard>
      </div>

      {/* Progress bar */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 flex items-center gap-3">
        <Hash className="h-4 w-4 text-slate-400" />
        <div className="flex-1 text-xs text-slate-600 dark:text-slate-300">
          กรอกครบ <strong className="text-slate-900 dark:text-slate-100">{filledCount}/3</strong> ส่วน
          · รวม <strong>{totalChars}</strong> ตัวอักษร
          {filledCount < 3 && (
            <span className="text-amber-700 dark:text-amber-400 ml-2">
              💡 ยิ่งกรอกครบ ผลลัพธ์ยิ่งแม่นยำ
            </span>
          )}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-sm ${
                i < filledCount ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="rounded-sm border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
          <Lightbulb className="h-4 w-4" />
          ตัวอย่างใช้งาน (คลิกเพื่อกรอกอัตโนมัติ)
        </div>
        <div className="space-y-1.5">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              suppressHydrationWarning
              onClick={() => onChange(ex.fields)}
              className="block w-full text-left text-xs text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded px-2 py-1.5 leading-relaxed border border-transparent hover:border-amber-300"
            >
              <Sparkles className="inline h-2.5 w-2.5 mr-1" />
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FieldCardProps {
  icon: React.ComponentType<{ className?: string }>;
  accent: "navy" | "gold" | "slate";
  step: string;
  label: string;
  hint: string;
  children: React.ReactNode;
}

function FieldCard({ icon: Icon, accent, step, label, hint, children }: FieldCardProps) {
  const accentMap = {
    navy: { border: "border-[#1e3a5f]/40", bg: "bg-[#1e3a5f]/5", iconBg: "bg-[#1e3a5f]" },
    gold: { border: "border-[#b8860b]/40", bg: "bg-[#b8860b]/5", iconBg: "bg-[#b8860b]" },
    slate: { border: "border-slate-300 dark:border-slate-700", bg: "bg-slate-50 dark:bg-slate-900/50", iconBg: "bg-slate-600" },
  }[accent];

  return (
    <div className={`rounded-sm border ${accentMap.border} ${accentMap.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-7 w-7 rounded-sm flex items-center justify-center text-white shrink-0 ${accentMap.iconBg}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-500">#{step}</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{hint}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
