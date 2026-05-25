"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Library,
  BookOpen,
  ClipboardList,
  X,
} from "lucide-react";
import type { PlanLevel } from "@/lib/strategic/types";

interface UploadFormProps {
  nationalStrategy: { id: string; title: string } | null;
  masterPlans: { id: string; title: string }[];
}

type Phase = "idle" | "uploading" | "success" | "error";

export function UploadForm({ nationalStrategy, masterPlans }: UploadFormProps) {
  const router = useRouter();

  const [level, setLevel] = useState<PlanLevel>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parentDocId, setParentDocId] = useState<string>("");
  const [replaceLevel1, setReplaceLevel1] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{
    document?: { id: string; title: string };
    itemCount?: number;
    durationMs?: number;
    tokens?: { input: number; output: number };
  } | null>(null);

  const needsParent = level === 2 || level === 3;
  const parentOptions =
    level === 2
      ? nationalStrategy
        ? [{ id: nationalStrategy.id, title: nationalStrategy.title }]
        : []
      : masterPlans;

  function onLevelChange(newLevel: PlanLevel) {
    setLevel(newLevel);
    setParentDocId("");
    setReplaceLevel1(false);
  }

  function onFilePick(f: File | null) {
    if (f && !f.name.toLowerCase().endsWith(".pdf")) {
      setPhase("error");
      setMessage("รองรับเฉพาะไฟล์ PDF เท่านั้น");
      return;
    }
    setFile(f);
    setPhase("idle");
    setMessage("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    if (level === 1 && nationalStrategy && !replaceLevel1) {
      setPhase("error");
      setMessage(
        `ยุทธศาสตร์ชาติ "${nationalStrategy.title}" มีอยู่แล้ว — กรุณาเลือก "แทนที่ของเดิม" เพื่อยืนยัน`
      );
      return;
    }
    if (needsParent && !parentDocId) {
      setPhase("error");
      setMessage(
        level === 2
          ? "ต้องเลือกยุทธศาสตร์ชาติเป็น parent ก่อน — ถ้ายังไม่มี กรุณาอัปโหลดระดับ 1 ก่อน"
          : "ต้องเลือกแผนแม่บทเป็น parent ก่อน"
      );
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("level", String(level));
    if (needsParent && parentDocId) fd.append("parentDocId", parentDocId);
    if (level === 1 && replaceLevel1) fd.append("replaceLevel1", "true");

    setPhase("uploading");
    setMessage("AI Engine กำลังอ่านเอกสาร...");

    try {
      const res = await fetch("/api/strategic/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPhase("error");
        setMessage(json.message ?? "เกิดข้อผิดพลาด");
        return;
      }
      setPhase("success");
      setResult(json.data);
      setMessage(`สำเร็จ — AI ดึงได้ ${json.data.itemCount} ข้อ`);
    } catch (err) {
      setPhase("error");
      setMessage((err as Error).message);
    }
  }

  function reset() {
    setFile(null);
    setPhase("idle");
    setMessage("");
    setResult(null);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Step 1: เลือกระดับ */}
      <Section
        step={1}
        title="ระดับของแผน"
        description="แต่ละระดับมีโครงสร้างต่างกัน — AI จะใช้ prompt ที่เหมาะกับระดับนั้น"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LevelOption
            selected={level === 1}
            onSelect={() => onLevelChange(1)}
            icon={Library}
            label="ระดับ 1"
            sub="ยุทธศาสตร์ชาติ"
            help="แผนระดับสูงสุดของประเทศ มีได้แค่ 1 ฉบับ"
            accent="navy"
          />
          <LevelOption
            selected={level === 2}
            onSelect={() => onLevelChange(2)}
            icon={BookOpen}
            label="ระดับ 2"
            sub="แผนแม่บท"
            help="แผนภายใต้ยุทธศาสตร์ชาติ — มีได้หลายฉบับ"
            accent="gold"
          />
          <LevelOption
            selected={level === 3}
            onSelect={() => onLevelChange(3)}
            icon={ClipboardList}
            label="ระดับ 3"
            sub="แผนปฏิบัติราชการ"
            help="แผนของหน่วยงาน เช่น สตช. — แมพกับแผนแม่บท"
            accent="slate"
          />
        </div>
      </Section>

      {/* Step 2: เลือก parent (ถ้าจำเป็น) */}
      {needsParent && (
        <Section
          step={2}
          title={`แมพกับ${level === 2 ? "ยุทธศาสตร์ชาติ" : "แผนแม่บท"}`}
          description="ระบุว่าแผนนี้อยู่ภายใต้แผนระดับสูงกว่าฉบับใด"
        >
          {parentOptions.length > 0 ? (
            <select
              value={parentDocId}
              onChange={(e) => setParentDocId(e.target.value)}
              required
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            >
              <option value="">-- กรุณาเลือก --</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-300 rounded-sm p-3">
              ยังไม่มี
              {level === 2 ? "ยุทธศาสตร์ชาติ" : "แผนแม่บท"}
              ในระบบ — กรุณาอัปโหลดระดับ {level - 1} ก่อน
            </div>
          )}
        </Section>
      )}

      {/* Step 1 replacement warning */}
      {level === 1 && nationalStrategy && (
        <div className="rounded-sm border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-amber-900">
                มียุทธศาสตร์ชาติอยู่แล้ว: {nationalStrategy.title}
              </div>
              <div className="text-amber-800 mt-1">
                การอัปโหลดใหม่จะ <strong>แทนที่</strong> ของเดิมทั้งหมด
                แผนแม่บทและแผนปฏิบัติเดิมจะยังคงอยู่
                แต่อาจต้องแมพใหม่ให้ตรงกับโครงสร้างใหม่
              </div>
              <label className="inline-flex items-center gap-2 mt-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceLevel1}
                  onChange={(e) => setReplaceLevel1(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-amber-900">
                  ยืนยันแทนที่ของเดิม
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: เลือกไฟล์ */}
      <Section
        step={needsParent ? 3 : 2}
        title="เลือกไฟล์ PDF"
        description="ไฟล์ต้องเป็น PDF ที่มีตัวอักษร (ไม่ใช่ scan) — AI จะอ่านโดยตรง"
      >
        <FilePicker file={file} onPick={onFilePick} />
      </Section>

      {/* Status messages */}
      {phase === "uploading" && (
        <div className="rounded-sm border border-blue-300 bg-blue-50 p-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-blue-700 animate-pulse" />
          <div className="text-sm text-blue-900 font-medium">{message}</div>
        </div>
      )}
      {phase === "error" && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-700 shrink-0" />
          <div className="text-sm text-red-900">{message}</div>
        </div>
      )}
      {phase === "success" && result && (
        <div className="rounded-sm border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-emerald-900">
                อัปโหลดและประมวลผลสำเร็จ
              </div>
              <div className="text-emerald-800 mt-1 space-y-0.5">
                <div>
                  ดึงข้อมูลได้ <strong>{result.itemCount}</strong> ข้อ
                </div>
                {result.durationMs && (
                  <div>ใช้เวลา {Math.round(result.durationMs / 1000)} วินาที</div>
                )}
                {result.tokens && (
                  <div className="text-xs text-emerald-700">
                    Token: input {result.tokens.input.toLocaleString()} · output{" "}
                    {result.tokens.output.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {result.document && (
                  <a
                    href={`/strategic/document/${result.document.id}`}
                    className="text-sm rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5"
                  >
                    เปิดเอกสาร
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/strategic")}
                  className="text-sm rounded-sm bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 px-3 py-1.5"
                >
                  กลับ คลังแผน
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm rounded-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5"
                >
                  อัปโหลดอีกฉบับ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {phase !== "success" && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/strategic")}
            className="text-sm rounded-sm border border-slate-300 hover:bg-slate-50 px-4 py-2"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={!file || phase === "uploading"}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            {phase === "uploading" ? "กำลังประมวลผล..." : "อัปโหลดและให้ AI วิเคราะห์"}
          </button>
        </div>
      )}
    </form>
  );
}

interface SectionProps {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ step, title, description, children }: SectionProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-sm p-5">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-start gap-3">
        <div className="h-6 w-6 shrink-0 rounded-sm bg-[#1e3a5f] text-white text-xs font-semibold flex items-center justify-center">
          {step}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

interface LevelOptionProps {
  selected: boolean;
  onSelect: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  help: string;
  accent: "navy" | "gold" | "slate";
}

function LevelOption({
  selected,
  onSelect,
  icon: Icon,
  label,
  sub,
  help,
  accent,
}: LevelOptionProps) {
  const accents = {
    navy: selected ? "border-[#1e3a5f] bg-[#1e3a5f]/[0.05] text-[#1e3a5f]" : "border-slate-200",
    gold: selected ? "border-[#b8860b] bg-[#b8860b]/[0.05] text-[#92400e]" : "border-slate-200",
    slate: selected ? "border-slate-700 bg-slate-50 text-slate-900" : "border-slate-200",
  };
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-sm border-2 p-4 hover:bg-slate-50 transition-colors ${accents[accent]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase font-semibold tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <div className="font-semibold text-sm text-slate-900">{sub}</div>
      <div className="text-xs text-slate-500 mt-1 leading-snug">{help}</div>
    </button>
  );
}

function FilePicker({
  file,
  onPick,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  }

  if (file) {
    return (
      <div className="rounded-sm border-2 border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <FileUp className="h-5 w-5 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-sm text-emerald-900 truncate">
              {file.name}
            </div>
            <div className="text-xs text-emerald-700">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="text-sm text-emerald-700 hover:text-emerald-900 p-1"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`block cursor-pointer rounded-sm border-2 border-dashed p-8 text-center transition-colors ${
        dragOver
          ? "border-[#1e3a5f] bg-[#1e3a5f]/[0.04]"
          : "border-slate-300 hover:border-slate-400 bg-slate-50"
      }`}
    >
      <FileUp className="h-8 w-8 mx-auto text-slate-400 mb-2" />
      <div className="text-sm font-medium text-slate-700">
        ลากไฟล์มาวาง หรือ คลิกเพื่อเลือก
      </div>
      <div className="text-xs text-slate-500 mt-1">
        เฉพาะไฟล์ PDF (สูงสุด ~10 MB)
      </div>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
