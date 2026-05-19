"use client";

// Create command form — POSTs to /api/commands
// Accepts prefill from AI draft (via sessionStorage)

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import {
  PRIORITY_LABELS,
  type CommandPriority,
} from "@/features/commands/types";

const PRIORITIES: CommandPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
  "CRITICAL",
];

interface Unit {
  id: string;
  code: string;
  name: string;
}

interface Mission {
  id: string;
  code: string;
  title: string;
}

export function NewCommandForm({
  units,
  missions,
}: {
  units: Unit[];
  missions: Mission[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAi = searchParams.get("from") === "ai";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAssisted, setAiAssisted] = useState(false);
  const [aiPromptUsed, setAiPromptUsed] = useState<unknown>(null);

  const [subject, setSubject] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reference, setReference] = useState("");
  const [objective, setObjective] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<CommandPriority>("NORMAL");
  const [missionId, setMissionId] = useState<string>("");
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>([]);

  // Load AI prefill from sessionStorage
  useEffect(() => {
    if (!fromAi) return;
    const raw = sessionStorage.getItem("ai-draft-prefill");
    if (!raw) return;
    try {
      const prefill = JSON.parse(raw);
      setSubject(prefill.subject ?? "");
      setRecipient(prefill.recipient ?? "");
      setReference(prefill.reference ?? "");
      setObjective(prefill.objective ?? "");
      setBody(prefill.body ?? "");
      setPriority(prefill.priority ?? "NORMAL");
      setAiAssisted(true);
      setAiPromptUsed(prefill.aiPromptUsed ?? null);
      // Clear after loading so navigating back doesn't reload
      sessionStorage.removeItem("ai-draft-prefill");
    } catch {
      /* ignore */
    }
  }, [fromAi]);

  function toggleUnit(id: string) {
    setTargetUnitIds((curr) =>
      curr.includes(id) ? curr.filter((u) => u !== id) : [...curr, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          recipient,
          reference: reference || undefined,
          objective: objective || undefined,
          body,
          priority,
          missionId: missionId || undefined,
          targetUnitIds,
          aiAssisted,
          aiPromptUsed:
            aiPromptUsed && typeof aiPromptUsed === "object"
              ? JSON.stringify(aiPromptUsed)
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(
            data.errors
              .map(
                (er: { field?: string; message: string }) =>
                  `${er.field ? er.field + ": " : ""}${er.message}`
              )
              .join("\n")
          );
        }
        throw new Error(data.message || "สร้างคำสั่งไม่สำเร็จ");
      }

      router.push(`/command/workflow/${data.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {aiAssisted && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <p className="text-sm text-violet-800">
            <span className="font-semibold">ร่างโดย AI</span> — ตรวจทาน
            แก้ไข แล้วเลือกหน่วยรับก่อนบันทึก
          </p>
        </div>
      )}

      {/* Subject */}
      <Field
        label="หัวเรื่อง *"
        hint="ระบุชื่อคำสั่งโดยย่อ"
      >
        <input
          type="text"
          required
          minLength={5}
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="เช่น คำสั่งเตรียมรับสถานการณ์ช่วงเทศกาล"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </Field>

      {/* Recipient */}
      <Field label="ผู้รับ *" hint="หน่วยงาน/บุคคลปลายทาง">
        <input
          type="text"
          required
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="เช่น ผบก. / หน่วยปฏิบัติทุกหน่วยในสังกัด"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority */}
        <Field label="ลำดับความสำคัญ *">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as CommandPriority)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>

        {/* Mission */}
        <Field label="ภารกิจที่เกี่ยวข้อง">
          <select
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">— ไม่ระบุ —</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Reference */}
      <Field label="อ้างถึง">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="เช่น หนังสือ ตร. ที่ ๐๐๐๑.๖๙/๑๒๓"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </Field>

      {/* Objective */}
      <Field label="วัตถุประสงค์">
        <textarea
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="เป้าหมายของการสั่งการ"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </Field>

      {/* Body */}
      <Field label="รายละเอียดคำสั่ง *" hint="อย่างน้อย 20 ตัวอักษร">
        <textarea
          required
          minLength={20}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="เนื้อหาคำสั่งโดยละเอียด..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      </Field>

      {/* Target Units */}
      <Field
        label={`หน่วยรับคำสั่ง * (เลือกแล้ว ${targetUnitIds.length} หน่วย)`}
        hint="เลือกอย่างน้อย 1 หน่วย"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50 max-h-60 overflow-y-auto">
          {units.map((u) => {
            const selected = targetUnitIds.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selected
                    ? "bg-blue-50 border-blue-300 text-blue-900"
                    : "bg-white border-slate-200 hover:border-blue-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleUnit(u.id)}
                  className="accent-blue-600"
                />
                <span className="font-mono text-xs text-slate-500">{u.code}</span>
                <span className="text-slate-800 truncate">{u.name}</span>
              </label>
            );
          })}
        </div>
      </Field>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 whitespace-pre-wrap">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          บันทึกร่าง
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
