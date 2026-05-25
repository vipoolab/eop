"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, GripVertical, Save, ChevronDown } from "lucide-react";
import type { FormField, FieldType, FormCategory } from "@/lib/report-forms/types";
import { FORM_CATEGORIES, FIELD_TYPE_LABELS } from "@/lib/report-forms/types";

const FIELD_TYPES = Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][];

function newField(type: FieldType): FormField {
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: "",
    required: false,
    placeholder: "",
    options: ["select", "radio", "checkbox"].includes(type) ? ["ตัวเลือก 1", "ตัวเลือก 2"] : undefined,
  };
}

export function FormBuilder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FormCategory>("ทั่วไป");
  const [fields, setFields] = useState<FormField[]>([]);
  const [error, setError] = useState("");

  function addField(type: FieldType) {
    setFields((prev) => [...prev, newField(type)]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
  }

  async function handleSave() {
    if (!name.trim()) { setError("กรุณาใส่ชื่อแบบฟอร์ม"); return; }
    if (fields.length === 0) { setError("กรุณาเพิ่มช่องกรอกอย่างน้อย 1 ช่อง"); return; }
    const emptyLabel = fields.find((f) => !f.label.trim());
    if (emptyLabel) { setError("กรุณาใส่ชื่อช่องกรอกให้ครบ"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/report-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          fields,
          createdBy: "admin",
          createdByName: "ผู้ดูแลระบบ",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const { data } = await res.json();
      router.push(`/forms/${data.id}`);
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Form meta */}
      <section className="bg-white border border-slate-200 rounded-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">
          ข้อมูลแบบฟอร์ม
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              ชื่อแบบฟอร์ม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น แบบรายงานผลการจับกุมผู้ต้องหา"
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              คำอธิบาย
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="อธิบายจุดประสงค์และการใช้งานแบบฟอร์มนี้"
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FormCategory)}
                className="w-full appearance-none rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none pr-8"
              >
                {FORM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Fields builder */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            ช่องกรอก ({fields.length})
          </h2>
          <span className="text-[11px] text-slate-400">ลากเพื่อเรียงลำดับ</span>
        </div>

        {fields.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            ยังไม่มีช่องกรอก — เพิ่มช่องกรอกด้านล่าง
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field, idx) => (
            <FieldEditor
              key={field.id}
              field={field}
              idx={idx}
              total={fields.length}
              onChange={(patch) => updateField(field.id, patch)}
              onRemove={() => removeField(field.id)}
              onMove={(dir) => moveField(idx, dir)}
            />
          ))}
        </div>

        {/* Add field buttons */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            เพิ่มช่องกรอก
          </div>
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map(([type, label]) => (
              <button
                key={type}
                type="button"
                suppressHydrationWarning
                onClick={() => addField(type)}
                className="inline-flex items-center gap-1 text-xs rounded-sm border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <Plus className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error + Save */}
      {error && (
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pb-8">
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => router.push("/forms")}
          className="rounded-sm border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:opacity-60 text-white text-sm font-medium px-5 py-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกแบบฟอร์ม"}
        </button>
      </div>
    </div>
  );
}

// ── FieldEditor ───────────────────────────────────────────────────────────

interface FieldEditorProps {
  field: FormField;
  idx: number;
  total: number;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

function FieldEditor({ field, idx, total, onChange, onRemove, onMove }: FieldEditorProps) {
  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);

  function addOption() {
    onChange({ options: [...(field.options ?? []), `ตัวเลือก ${(field.options?.length ?? 0) + 1}`] });
  }

  function updateOption(i: number, val: string) {
    const opts = [...(field.options ?? [])];
    opts[i] = val;
    onChange({ options: opts });
  }

  function removeOption(i: number) {
    onChange({ options: (field.options ?? []).filter((_, j) => j !== i) });
  }

  return (
    <div className="px-5 py-4 hover:bg-slate-50/50">
      <div className="flex items-start gap-3">
        {/* Drag handle + index */}
        <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => onMove(-1)}
            disabled={idx === 0}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 p-0.5"
            aria-label="ขึ้น"
          >
            ▲
          </button>
          <GripVertical className="h-4 w-4 text-slate-300" />
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => onMove(1)}
            disabled={idx === total - 1}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 p-0.5"
            aria-label="ลง"
          >
            ▼
          </button>
        </div>

        <div className="flex-1 space-y-3">
          {/* Type badge + remove */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              #{idx + 1}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
              {FIELD_TYPE_LABELS[field.type]}
            </span>
            <button
              type="button"
              suppressHydrationWarning
              onClick={onRemove}
              className="ml-auto text-slate-400 hover:text-red-500 p-1"
              aria-label="ลบ"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Label */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                ชื่อช่องกรอก <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="เช่น ชื่อผู้ต้องหา"
                className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
              />
            </div>

            {/* Placeholder (not for select/radio/checkbox/rating/date) */}
            {["text", "textarea", "number"].includes(field.type) && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                  ข้อความ placeholder
                </label>
                <input
                  type="text"
                  value={field.placeholder ?? ""}
                  onChange={(e) => onChange({ placeholder: e.target.value })}
                  placeholder="ข้อความแนะนำในช่อง"
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                />
              </div>
            )}

            {/* Required toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id={`req-${field.id}`}
                checked={field.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                className="h-3.5 w-3.5 rounded-sm accent-[#1e3a5f]"
              />
              <label
                htmlFor={`req-${field.id}`}
                className="text-sm text-slate-700 cursor-pointer"
              >
                จำเป็นต้องกรอก
              </label>
            </div>

            {/* Help text */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                คำอธิบายช่อง (optional)
              </label>
              <input
                type="text"
                value={field.helpText ?? ""}
                onChange={(e) => onChange({ helpText: e.target.value })}
                placeholder="คำแนะนำเพิ่มเติม"
                className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
              />
            </div>
          </div>

          {/* Options (select/radio/checkbox) */}
          {hasOptions && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                ตัวเลือก
              </label>
              <div className="space-y-1.5">
                {(field.options ?? []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                    />
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => removeOption(i)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={addOption}
                  className="inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  เพิ่มตัวเลือก
                </button>
              </div>
            </div>
          )}

          {/* Number validation */}
          {field.type === "number" && (
            <div className="flex gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                  ค่าต่ำสุด
                </label>
                <input
                  type="number"
                  value={field.validation?.min ?? ""}
                  onChange={(e) =>
                    onChange({
                      validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined },
                    })
                  }
                  className="w-24 rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                  ค่าสูงสุด
                </label>
                <input
                  type="number"
                  value={field.validation?.max ?? ""}
                  onChange={(e) =>
                    onChange({
                      validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined },
                    })
                  }
                  className="w-24 rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
