// /commands/[id]/cascade — รับทราบ + มอบหมายหน่วยรอง (sub-units)
// Dedicated screen for unit-head personas who received a command and need to
// (1) acknowledge their own receipt, and
// (2) delegate the command to specific sub-units in their org with personal notes.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Target,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCommand } from "@/lib/commands/store";
import { getActivePersona, getUnit, getDescendants } from "@/lib/police-org/store";
import { CascadeForm } from "./cascade-form";

export const dynamic = "force-dynamic";

export default async function CascadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cmd = getCommand(id);
  if (!cmd) notFound();

  const persona = getActivePersona();
  const personaUnit = getUnit(persona.unitId);

  // Find this persona's entry in unitProgress
  const myProgress = cmd.unitProgress.find((u) => u.unitId === persona.unitId);

  if (!myProgress) {
    // This persona's unit is not in the command — redirect to normal detail
    redirect(`/commands/${id}`);
  }

  // Get sub-units of this persona's unit that are also in effectiveUnitIds
  const subUnits = personaUnit
    ? getDescendants(personaUnit.id).filter(
        (u) =>
          cmd.effectiveUnitIds.includes(u.id) &&
          u.id !== personaUnit.id
      )
    : [];

  const subUnitProgress = subUnits.map((u) => {
    const up = cmd.unitProgress.find((x) => x.unitId === u.id);
    return { unit: u, status: up?.status ?? "PENDING" };
  });

  const isAlreadyAcknowledged = myProgress.status !== "PENDING";

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/inbox" className="hover:underline">
          งานรอ
        </Link>
        <span>›</span>
        <Link href={`/commands/${cmd.id}`} className="hover:underline">
          รายละเอียดคำสั่ง
        </Link>
        <span>›</span>
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          รับทราบและมอบหมายหน่วยรอง
        </span>
      </div>

      <Link
        href={`/commands/${cmd.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปดูรายละเอียดคำสั่ง
      </Link>

      {/* Hero — clear "cascade" mode banner */}
      <section className="rounded-sm border-2 border-[#b8860b] bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-950 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#142a45] px-5 py-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#d4a017]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4a017]">
            CASCADE & DELEGATE MODE
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-sm bg-[#1e3a5f] flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-[#d4a017]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#b8860b]">
                หน่วยของท่าน
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {personaUnit?.name ?? "—"}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {persona.rank} {persona.name.split(" ").slice(1).join(" ")} ·{" "}
                {persona.role}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            หน่วยของท่านได้รับหนังสือสั่งการนี้ <strong>กรุณารับทราบและมอบหมายหน่วยรองในสังกัด</strong> ({subUnits.length} หน่วย) ที่ต้องร่วมปฏิบัติงาน
            พร้อมระบุข้อสั่งการเฉพาะ/ความเร่งด่วน/หมายเหตุได้ตามต้องการ
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ขั้นที่ ๑ รับทราบ {isAlreadyAcknowledged ? "✓" : ""}
            </div>
            <span>›</span>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-amber-600" />
              ขั้นที่ ๒ เลือกหน่วยรอง
            </div>
            <span>›</span>
            <div className="flex items-center gap-1">
              <Send className="h-3 w-3 text-blue-600" />
              ขั้นที่ ๓ ส่งต่อพร้อมข้อสั่งการ
            </div>
          </div>
        </div>
      </section>

      <PageHeader
        icon={FileText}
        eyebrow={cmd.letter.docNumber ?? "—"}
        title={cmd.letter.subject}
        description={`จาก ${cmd.createdByTitle} ${cmd.createdByName.split(" ").slice(1).join(" ")} — เผยแพร่เมื่อ ${cmd.dispatchedAt ? new Date(cmd.dispatchedAt).toLocaleDateString("th-TH") : "—"}`}
      />

      {/* Two-column layout — letter summary + action panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT — Letter summary (read-only) */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1e3a5f] dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              สรุปหนังสือสั่งการ
            </h3>
          </div>
          <div className="p-5 space-y-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            <DetailRow label="เรียน">{cmd.letter.recipient}</DetailRow>
            {cmd.letter.objective && (
              <DetailRow label="วัตถุประสงค์">{cmd.letter.objective}</DetailRow>
            )}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                ข้อสั่งการหลัก
              </div>
              <ul className="space-y-1.5">
                {cmd.letter.directives.map((d, i) => (
                  <li key={i} className="text-sm">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            {cmd.letter.reportInstruction && (
              <DetailRow label="ระยะเวลา/รายงาน">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {cmd.letter.reportInstruction}
                </span>
              </DetailRow>
            )}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  วันเริ่ม
                </div>
                <div className="font-mono">
                  {new Date(cmd.effectiveDate).toLocaleDateString("th-TH")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  ครบกำหนด
                </div>
                <div className="font-mono">
                  {new Date(cmd.dueDate).toLocaleDateString("th-TH")}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/commands/${cmd.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#1e3a5f] dark:text-blue-400 hover:underline"
              >
                <FileText className="h-3 w-3" />
                ดูหนังสือสั่งการฉบับเต็ม
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT — Action panel (cascade form) */}
        <section className="lg:col-span-3 bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-sm overflow-hidden">
          <div className="border-b border-emerald-100 dark:border-emerald-800 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              การดำเนินการของท่าน
            </h3>
            {isAlreadyAcknowledged && (
              <span className="ml-auto text-[10px] font-semibold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-sm">
                รับทราบแล้ว
              </span>
            )}
          </div>
          <div className="p-5">
            {subUnits.length === 0 ? (
              <div className="rounded-sm border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">ไม่มีหน่วยรองในสังกัดที่ได้รับคำสั่งนี้</div>
                    <div className="text-xs leading-relaxed">
                      คำสั่งนี้ส่งถึงหน่วยของท่านโดยตรง — ไม่มีหน่วยรองในสังกัดที่ต้องมอบหมายต่อ
                      กรุณากลับไปดูรายละเอียดและดำเนินการต่อ
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <CascadeForm
                commandId={cmd.id}
                myUnitId={persona.unitId}
                myUnitName={personaUnit?.name ?? ""}
                isAlreadyAcknowledged={isAlreadyAcknowledged}
                subUnits={subUnitProgress.map((s) => ({
                  id: s.unit.id,
                  name: s.unit.name,
                  shortName: s.unit.shortName ?? s.unit.code,
                  commanderTitle: s.unit.commanderTitle,
                  province: s.unit.province,
                  currentStatus: s.status,
                }))}
              />
            )}
          </div>
        </section>
      </div>

      {/* Current unit progress overview */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#b8860b]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            สถานะหน่วยที่ได้รับคำสั่งทั้งหมด
          </h3>
          <span className="ml-auto text-[10px] text-slate-500">
            {cmd.unitProgress.length} หน่วย
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-2 w-12">#</th>
              <th className="text-left px-4 py-2">หน่วย</th>
              <th className="text-center px-4 py-2 w-32">สถานะ</th>
              <th className="text-left px-4 py-2 w-40">รับทราบเมื่อ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {cmd.unitProgress.map((up, i) => {
              const u = getUnit(up.unitId);
              const isMe = up.unitId === persona.unitId;
              return (
                <tr
                  key={up.unitId}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isMe ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                >
                  <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {u?.name ?? up.unitId}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-sm">
                          ท่าน
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge status={up.status} />
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {up.acknowledgedAt
                      ? new Date(up.acknowledgedAt).toLocaleString("th-TH")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: "รอรับทราบ", color: "bg-amber-100 text-amber-800 border-amber-300" },
    ACKNOWLEDGED: { label: "รับทราบแล้ว", color: "bg-blue-100 text-blue-800 border-blue-300" },
    IN_PROGRESS: { label: "ปฏิบัติ", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
    REPORTED: { label: "ส่งผลแล้ว", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    CLOSED: { label: "ปิด", color: "bg-slate-100 text-slate-700 border-slate-300" },
  };
  const x = map[status] ?? map.PENDING;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${x.color}`}>
      {x.label}
    </span>
  );
}
