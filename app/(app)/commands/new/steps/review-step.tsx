"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Building2,
  Calendar,
  Target,
  Library,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import type { WizardState } from "../command-wizard";
import type { OrgUnit } from "@/lib/police-org/types";
import { Garuda } from "@/components/garuda";

// Thai-numeral helper (mirrors draft-step)
const THAI_DIGIT = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
function toThaiNumeral(n: number): string {
  return String(n)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGIT[Number(c)] : c))
    .join("");
}
function thaiDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${toThaiNumeral(d.getDate())} ${months[d.getMonth()]} พ.ศ. ${toThaiNumeral(d.getFullYear() + 543)}`;
}

interface Props {
  state: WizardState;
}

export function ReviewStep({ state }: Props) {
  const [unitMap, setUnitMap] = useState<Record<string, OrgUnit>>({});

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((j) => {
        const map: Record<string, OrgUnit> = {};
        const walk = (n: { id: string; children: { id: string }[] } & OrgUnit) => {
          map[n.id] = n;
          n.children.forEach((c) => walk(c as typeof n));
        };
        if (j.data?.tree) walk(j.data.tree);
        setUnitMap(map);
      });
  }, []);

  const targets = state.targetUnitIds.map((id) => unitMap[id]).filter(Boolean);

  if (!state.draftResult) {
    return (
      <div className="text-sm text-slate-500 text-center py-8">
        ยังไม่มีข้อมูลให้ตรวจสอบ — กลับไปทำขั้นก่อนหน้า
      </div>
    );
  }

  const letter = state.draftResult.letter;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
          ขั้นที่ ๖
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          ตรวจสอบและส่ง
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          ตรวจสอบรายละเอียดทั้งหมดก่อนกระจายคำสั่ง
        </p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryStat
          icon={Building2}
          label="หน่วยรับ"
          value={`${state.targetUnitIds.length} หน่วย`}
          sub={state.cascadeMode === "CASCADE" ? "+ลูกหลาน" : "ส่งตรง"}
        />
        <SummaryStat
          icon={Calendar}
          label="ระยะเวลา"
          value={`${calcDays(state.effectiveDate, state.dueDate)} วัน`}
          sub={new Date(state.effectiveDate).toLocaleDateString("th-TH")}
        />
        <SummaryStat
          icon={Target}
          label="ตัวชี้วัด"
          value={`${state.kpis.length} KPI`}
          sub={`${state.kpis.filter((k) => k.type === "QUANTITATIVE").length} ปริมาณ · ${state.kpis.filter((k) => k.type === "QUALITATIVE").length} คุณภาพ`}
        />
        <SummaryStat
          icon={FileText}
          label="แผนที่จับคู่"
          value={`${
            state.draftResult.alignment.actionPlanItemIds.length +
            state.draftResult.alignment.masterPlanItemIds.length +
            state.draftResult.alignment.nationalStrategyItemIds.length
          } ข้อ`}
          sub="L1/L2/L3"
        />
      </div>

      {/* Alignment bar */}
      <div className="rounded-sm border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
          การจับคู่แผน
        </div>
        <div className="space-y-1.5">
          <AlignmentRow
            icon={Library}
            level="ระดับ ๑ ยุทธศาสตร์ชาติ"
            count={state.draftResult.alignment.nationalStrategyItemIds.length}
            accent="navy"
          />
          <AlignmentRow
            icon={BookOpen}
            level="ระดับ ๒ แผนแม่บท"
            count={state.draftResult.alignment.masterPlanItemIds.length}
            accent="gold"
          />
          <AlignmentRow
            icon={ClipboardList}
            level="ระดับ ๓ แผนปฏิบัติราชการ"
            count={state.draftResult.alignment.actionPlanItemIds.length}
            accent="slate"
          />
        </div>
      </div>

      {/* Letter preview — "คำสั่ง" format per ระเบียบสารบรรณ ข้อ ๒๒ */}
      <section className="bg-slate-100 border border-slate-200 rounded-sm p-6">
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
          <FileText className="h-3.5 w-3.5" />
          ตัวอย่างคำสั่ง — รูปแบบราชการ
        </div>
        <div
          className="bg-white border border-slate-300 shadow-md max-w-3xl mx-auto font-[var(--font-sarabun)] text-slate-900"
          style={{ padding: "3rem 2.5rem 2.5rem 3rem", lineHeight: 1.45, fontSize: "15px" }}
        >
          {/* Garuda emblem */}
          <div className="flex flex-col items-center mb-3">
            <Garuda size={56} className="text-slate-800" />
          </div>

          {/* Header block */}
          <div className="text-center space-y-1 mb-3">
            <div className="text-base font-semibold">คำสั่งสำนักงานตำรวจแห่งชาติ</div>
            <div>ที่ {"...../๒๕๖๙"}</div>
            <div>เรื่อง  {letter.subject.replace(/^\s*เรื่อง\s*/, "")}</div>
          </div>

          {/* Divider */}
          <div className="flex justify-center my-3">
            <div className="border-t border-slate-700 w-32" />
          </div>

          {/* Body */}
          {letter.objective && (
            <p className="text-justify my-3" style={{ textIndent: "2.5em" }}>
              {letter.objective}
            </p>
          )}
          {letter.legalBasis && (
            <p className="text-justify my-3" style={{ textIndent: "2.5em" }}>
              {letter.legalBasis}
            </p>
          )}
          <div className="my-3 space-y-2">
            {letter.directives.map((d, idx) => (
              <p key={idx} className="text-justify" style={{ textIndent: "2.5em" }}>
                {d}
              </p>
            ))}
          </div>
          {letter.effectiveClause && (
            <p className="text-justify my-3" style={{ textIndent: "2.5em" }}>
              {letter.effectiveClause}
            </p>
          )}

          {/* Signed at + Signature */}
          <div className="text-center mt-8 mb-2">
            สั่ง ณ วันที่ {thaiDate(new Date())}
          </div>
          <div className="text-center mt-8 space-y-0.5">
            <div className="mx-auto border-b border-slate-400 w-64 mb-1" />
            <div>(ชื่อ-นามสกุลผู้สั่งการ)</div>
            <div>ตำแหน่งผู้สั่งการ</div>
            <div className="mt-2 text-xs text-slate-500 italic">
              ลายเซ็นจะปรากฏเมื่ออนุมัติและกดส่ง
            </div>
          </div>
        </div>
      </section>

      {/* Targets list */}
      <section className="rounded-sm border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
          หน่วยรับคำสั่ง ({targets.length})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
          {targets.map((u) => (
            <div
              key={u.id}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-sm"
            >
              <span className="font-medium text-slate-900">
                {u.shortName ?? u.code}
              </span>
              {u.province && (
                <span className="text-[10px] text-slate-500 ml-1">
                  ({u.province})
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section className="rounded-sm border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
          ตัวชี้วัด ({state.kpis.length})
        </div>
        <div className="space-y-1.5">
          {state.kpis.map((k) => (
            <div
              key={k.id}
              className="flex items-center gap-2 text-sm border border-slate-200 rounded-sm px-2 py-1.5"
            >
              <div
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${
                  k.type === "QUANTITATIVE"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {k.type === "QUANTITATIVE" ? "ปริมาณ" : "คุณภาพ"}
              </div>
              <div className="flex-1 text-slate-900">{k.metric}</div>
              {k.type === "QUANTITATIVE" && (
                <div className="text-xs text-slate-600">
                  เป้า {k.targetTotal?.toLocaleString() ?? "—"} {k.unit ?? ""}
                </div>
              )}
            </div>
          ))}
        </div>
        {targets.length > 0 && (
          <div className="text-[11px] text-slate-500 mt-2">
            💡 KPI จะถูก auto-distribute ไปยังหน่วยที่ได้รับคำสั่งทั้งหมด — รวมหน่วยลูกหากเลือก Cascade
          </div>
        )}
      </section>
    </div>
  );
}

function calcDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(0, Math.ceil((e - s) / (24 * 60 * 60 * 1000)));
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label}: </span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}

interface AlignmentRowProps {
  icon: React.ComponentType<{ className?: string }>;
  level: string;
  count: number;
  accent: "navy" | "gold" | "slate";
}

function AlignmentRow({ icon: Icon, level, count, accent }: AlignmentRowProps) {
  const styles = {
    navy: "text-[#1e3a5f]",
    gold: "text-[#92400e]",
    slate: "text-slate-700",
  }[accent];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`flex items-center gap-2 ${styles}`}>
        <Icon className="h-4 w-4" />
        {level}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {count} ข้อ
      </span>
    </div>
  );
}

interface SummaryStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}

function SummaryStat({ icon: Icon, label, value, sub }: SummaryStatProps) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-base font-bold text-slate-900 leading-tight">
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
