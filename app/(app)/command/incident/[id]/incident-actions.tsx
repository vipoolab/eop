"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Building2,
  PlayCircle,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface UnitOpt {
  id: string;
  code: string;
  name: string;
}
interface RefOpt {
  id: string;
  code?: string;
  docNo?: string;
  title?: string;
  subject?: string;
}

interface Props {
  id: string;
  canAssign: boolean;
  canRespond: boolean;
  canLink: boolean;
  canClose: boolean;
  canAddAar: boolean;
  currentAssignedUnitId: string | null;
  currentMissionId: string | null;
  currentCommandId: string | null;
  units: UnitOpt[];
  missions: RefOpt[];
  commands: RefOpt[];
}

export function IncidentActions(props: Props) {
  const router = useRouter();
  const [openPanel, setOpenPanel] = useState<"assign" | "link" | "close" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assign state
  const [unitId, setUnitId] = useState(props.currentAssignedUnitId ?? "");
  const [assignNote, setAssignNote] = useState("");

  // Link state
  const [missionId, setMissionId] = useState(props.currentMissionId ?? "");
  const [commandId, setCommandId] = useState(props.currentCommandId ?? "");

  // Close state
  const [resolution, setResolution] = useState("");

  async function callApi(path: string, body: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setOpenPanel(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">🛠️ การดำเนินการ</h3>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 mb-3 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {props.canRespond && (
          <button
            onClick={() => callApi(`/api/incidents/${props.id}/respond`, {})}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            รับงานนี้
          </button>
        )}
        {props.canAssign && (
          <button
            onClick={() => setOpenPanel(openPanel === "assign" ? null : "assign")}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
              openPanel === "assign"
                ? "bg-amber-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Building2 className="h-4 w-4" />
            {props.currentAssignedUnitId ? "เปลี่ยนหน่วยรับ" : "มอบหมายหน่วยรับ"}
          </button>
        )}
        {props.canLink && (
          <button
            onClick={() => setOpenPanel(openPanel === "link" ? null : "link")}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
              openPanel === "link"
                ? "bg-violet-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            เชื่อม Mission/Command
          </button>
        )}
        {props.canClose && (
          <button
            onClick={() => setOpenPanel(openPanel === "close" ? null : "close")}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
              openPanel === "close"
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            ปิดคดี
          </button>
        )}
        {props.canAddAar && (
          <a
            href="/reports/aar"
            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-100"
          >
            <FileText className="h-4 w-4" />
            สร้าง AAR
          </a>
        )}
      </div>

      {/* Assign panel */}
      {openPanel === "assign" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
          <h4 className="text-sm font-semibold text-amber-900">มอบหมายหน่วยรับผิดชอบ</h4>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">— เลือกหน่วยรับ —</option>
            {props.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="หมายเหตุ (ไม่บังคับ)"
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={() => callApi(`/api/incidents/${props.id}/assign`, { unitId, note: assignNote || null })}
            disabled={loading || !unitId}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            บันทึก
          </button>
        </div>
      )}

      {/* Link panel */}
      {openPanel === "link" && (
        <div className="rounded-md border border-violet-200 bg-violet-50 p-3 space-y-2">
          <h4 className="text-sm font-semibold text-violet-900">เชื่อมกับ Mission / Command</h4>
          <select
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">— ไม่ผูก Mission —</option>
            {props.missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.title}
              </option>
            ))}
          </select>
          <select
            value={commandId}
            onChange={(e) => setCommandId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">— ไม่ผูก Command —</option>
            {props.commands.map((c) => (
              <option key={c.id} value={c.id}>
                {c.docNo} — {c.subject}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              callApi(`/api/incidents/${props.id}/link`, {
                missionId: missionId || null,
                commandId: commandId || null,
              })
            }
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            บันทึก Link
          </button>
        </div>
      )}

      {/* Close panel */}
      {openPanel === "close" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <h4 className="text-sm font-semibold text-emerald-900">ปิดคดี</h4>
          <textarea
            placeholder="ระบุการแก้ไข/ผลลัพธ์ (≥ 5 ตัวอักษร) — เช่น 'จับกุมผู้กระทำผิด ส่งดำเนินคดีตาม ก.ม.อาญา ม.๓๓๔'"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          />
          <button
            onClick={() => callApi(`/api/incidents/${props.id}/close`, { resolution })}
            disabled={loading || resolution.length < 5}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            ปิดคดี
          </button>
        </div>
      )}
    </div>
  );
}
