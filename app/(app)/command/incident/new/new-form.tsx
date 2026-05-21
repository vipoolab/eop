"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, AlertOctagon } from "lucide-react";

interface UnitOpt {
  id: string;
  code: string;
  name: string;
}
interface MissionOpt {
  id: string;
  code: string;
  title: string;
}

const TYPES = ["อาชญากรรม", "อุบัติเหตุ", "ประท้วง", "ข่าวกรอง", "ฉุกเฉิน"];

export function NewIncidentForm({
  units,
  missions,
}: {
  units: UnitOpt[];
  missions: MissionOpt[];
}) {
  const router = useRouter();
  const [type, setType] = useState("อาชญากรรม");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState(5);
  const [assignedUnitId, setAssignedUnitId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.length < 5) {
      setError("หัวข้อต้อง ≥ 5 ตัวอักษร");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description: description || null,
          location: location || null,
          severity,
          assignedUnitId: assignedUnitId || null,
          missionId: missionId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.push(`/command/incident/${data.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="ประเภท *">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="ระดับความรุนแรง (1-10)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="flex-1"
              />
              <span
                className={`text-lg font-bold tabular-nums w-8 text-center ${
                  severity >= 8 ? "text-rose-700" : severity >= 6 ? "text-amber-700" : "text-slate-700"
                }`}
              >
                {severity}
              </span>
            </div>
          </Field>
        </div>

        <Field label="หัวข้อเหตุการณ์ *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            placeholder="เช่น เหตุปล้นทรัพย์ร้านทอง ซอย 11"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="พื้นที่/สถานที่">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น บางรัก · กรุงเทพมหานคร"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="รายละเอียด">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="สถานการณ์ · ผู้เสียหาย · พยานหลักฐานเบื้องต้น"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <Field label="มอบหมายหน่วยรับ (ไม่บังคับ)">
            <select
              value={assignedUnitId}
              onChange={(e) => setAssignedUnitId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— ยังไม่มอบหมาย —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ผูกกับ Mission (ไม่บังคับ)">
            <select
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— ไม่ผูก —</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading || title.length < 5}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
          บันทึกเหตุการณ์
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
