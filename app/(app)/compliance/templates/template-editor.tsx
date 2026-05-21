"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Copy,
  AlertCircle,
  Power,
} from "lucide-react";
import {
  STANDARD_LABELS,
  type ComplianceStandard,
} from "@/features/compliance/types";

interface Item {
  id?: string; // existing item id (optional for new)
  localId: string; // client-side draft id
  code: string;
  category: string;
  question: string;
  weight: number;
  evidenceRequired: boolean;
}

interface TemplateData {
  id?: string;
  standard: ComplianceStandard;
  code: string;
  name: string;
  version: string;
  effectiveDate: string; // ISO date
  active: boolean;
  items: Item[];
  reportCount?: number;
}

const STANDARDS: ComplianceStandard[] = [
  "GOR_POR_ROR",
  "ITA",
  "PMQA",
  "GOV4_0",
  "CUSTOM",
];

let localCounter = 0;
function newLocalId(): string {
  localCounter += 1;
  return `local-${Date.now()}-${localCounter}`;
}

export function TemplateEditor({ initial }: { initial: TemplateData }) {
  const router = useRouter();
  const [data, setData] = useState<TemplateData>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClone, setShowClone] = useState(false);
  const [cloneVersion, setCloneVersion] = useState("");
  const [cloneCode, setCloneCode] = useState("");
  const [cloneDate, setCloneDate] = useState("");

  const isNew = !data.id;
  const usedInReports = (data.reportCount ?? 0) > 0;
  const lockedItems = usedInReports;

  function setField<K extends keyof TemplateData>(key: K, val: TemplateData[K]) {
    setData((p) => ({ ...p, [key]: val }));
  }

  function addItem() {
    setData((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          localId: newLocalId(),
          code: `Q${p.items.length + 1}`,
          category: p.items[p.items.length - 1]?.category ?? "",
          question: "",
          weight: 1.0,
          evidenceRequired: false,
        },
      ],
    }));
  }

  function deleteItem(localId: string) {
    setData((p) => ({ ...p, items: p.items.filter((i) => i.localId !== localId) }));
  }

  function updateItem(localId: string, patch: Partial<Item>) {
    setData((p) => ({
      ...p,
      items: p.items.map((i) => (i.localId === localId ? { ...i, ...patch } : i)),
    }));
  }

  function moveItem(localId: string, dir: -1 | 1) {
    setData((p) => {
      const idx = p.items.findIndex((i) => i.localId === localId);
      if (idx < 0) return p;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= p.items.length) return p;
      const items = [...p.items];
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...p, items };
    });
  }

  async function save() {
    setError(null);
    // Validate
    if (data.name.length < 3) {
      setError("ชื่อ template ต้อง ≥ 3 ตัวอักษร");
      return;
    }
    if (!data.code) {
      setError("ต้องระบุรหัส template");
      return;
    }
    if (!data.version) {
      setError("ต้องระบุ version");
      return;
    }
    if (data.items.length === 0) {
      setError("ต้องมี checklist อย่างน้อย 1 ข้อ");
      return;
    }
    for (const it of data.items) {
      if (!it.question || it.question.length < 5) {
        setError(`ข้อ "${it.code}" — คำถามต้อง ≥ 5 ตัวอักษร`);
        return;
      }
    }

    setLoading(true);
    try {
      const url = isNew
        ? "/api/compliance/templates"
        : `/api/compliance/templates/${data.id}`;
      const method = isNew ? "POST" : "PATCH";
      const body = {
        standard: data.standard,
        code: data.code,
        name: data.name,
        version: data.version,
        effectiveDate: data.effectiveDate,
        ...(isNew || !lockedItems
          ? {
              items: data.items.map((it, idx) => ({
                code: it.code,
                category: it.category || "ทั่วไป",
                question: it.question,
                weight: it.weight,
                order: idx,
                evidenceRequired: it.evidenceRequired,
              })),
            }
          : {}),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "บันทึกไม่สำเร็จ");
      }
      if (isNew) {
        router.push(`/compliance/templates/${result.data.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    if (!data.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/templates/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !data.active }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);
      setField("active", !data.active);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function doClone() {
    if (!data.id) return;
    setError(null);
    if (!cloneCode || !cloneVersion || !cloneDate) {
      setError("กรอกรหัส + version + วันมีผล ให้ครบ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/templates/${data.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cloneCode,
          version: cloneVersion,
          effectiveDate: cloneDate,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);
      router.push(`/compliance/templates/${result.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clone ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!data.id) return;
    if (!confirm("ยืนยันลบ template? — กู้คืนไม่ได้")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/templates/${data.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);
      router.push("/compliance/templates");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      setLoading(false);
    }
  }

  // Group items by category for display
  const totalWeight = data.items.reduce((s, i) => s + i.weight, 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {usedInReports && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Template นี้ใช้ในรายงาน {data.reportCount} ฉบับแล้ว — แก้ checklist
          ไม่ได้ ให้กด <strong>Clone</strong> สร้าง version ใหม่แทน
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          ข้อมูลพื้นฐาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              มาตรฐาน *
            </label>
            <select
              value={data.standard}
              onChange={(e) =>
                setField("standard", e.target.value as ComplianceStandard)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {STANDARDS.map((s) => (
                <option key={s} value={s}>
                  {STANDARD_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              รหัส *
            </label>
            <input
              type="text"
              value={data.code}
              onChange={(e) => setField("code", e.target.value)}
              placeholder="เช่น GPR-2569"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              ชื่อ Template *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="เช่น รายงาน ก.พ.ร. ประจำปี 2569"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Version *
            </label>
            <input
              type="text"
              value={data.version}
              onChange={(e) => setField("version", e.target.value)}
              placeholder="1.0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              วันที่มีผล *
            </label>
            <input
              type="date"
              value={data.effectiveDate.slice(0, 10)}
              onChange={(e) => setField("effectiveDate", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Items editor */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Checklist ({data.items.length} ข้อ
            <span className="text-slate-400">
              {" "}
              · น้ำหนักรวม {totalWeight.toFixed(1)}
            </span>
            )
          </h3>
          {!lockedItems && (
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1"
            >
              <Plus className="h-3 w-3" />
              เพิ่มข้อ
            </button>
          )}
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
            ยังไม่มีข้อใน checklist — กดเพิ่มข้อด้านบน
          </div>
        ) : (
          <div className="space-y-2">
            {data.items.map((it, idx) => (
              <div
                key={it.localId}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
              >
                <div className="flex items-start gap-2">
                  {!lockedItems && (
                    <div className="flex flex-col items-center gap-0.5 pt-1">
                      <button
                        type="button"
                        onClick={() => moveItem(it.localId, -1)}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        ▲
                      </button>
                      <GripVertical className="h-3 w-3 text-slate-300" />
                      <button
                        type="button"
                        onClick={() => moveItem(it.localId, 1)}
                        disabled={idx === data.items.length - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={it.code}
                        onChange={(e) =>
                          updateItem(it.localId, { code: e.target.value })
                        }
                        disabled={lockedItems}
                        placeholder="รหัส (เช่น Q1)"
                        className="col-span-3 rounded-md border border-slate-300 px-2 py-1 text-sm bg-white disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={it.category}
                        onChange={(e) =>
                          updateItem(it.localId, { category: e.target.value })
                        }
                        disabled={lockedItems}
                        placeholder="หมวด (เช่น หมวด 1 บริหาร)"
                        className="col-span-6 rounded-md border border-slate-300 px-2 py-1 text-sm bg-white disabled:opacity-50"
                      />
                      <div className="col-span-3 flex items-center gap-1">
                        <label className="text-[10px] text-slate-500">
                          น้ำหนัก
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={it.weight}
                          onChange={(e) =>
                            updateItem(it.localId, {
                              weight: Number(e.target.value),
                            })
                          }
                          disabled={lockedItems}
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm tabular-nums bg-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <textarea
                      value={it.question}
                      onChange={(e) =>
                        updateItem(it.localId, { question: e.target.value })
                      }
                      disabled={lockedItems}
                      placeholder="คำถาม / ตัวชี้วัด (เช่น หน่วยงานมีระเบียบป้องกันการทุจริต)"
                      rows={2}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm bg-white disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={it.evidenceRequired}
                          onChange={(e) =>
                            updateItem(it.localId, {
                              evidenceRequired: e.target.checked,
                            })
                          }
                          disabled={lockedItems}
                        />
                        ต้องแนบหลักฐาน
                      </label>
                      {!lockedItems && (
                        <button
                          type="button"
                          onClick={() => deleteItem(it.localId)}
                          className="text-xs text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clone panel */}
      {!isNew && showClone && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🔁 Clone Template เป็น version ใหม่
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              value={cloneCode}
              onChange={(e) => setCloneCode(e.target.value)}
              placeholder="รหัสใหม่ เช่น GPR-2570"
              className="rounded-md border border-blue-300 px-2 py-1 text-sm bg-white"
            />
            <input
              type="text"
              value={cloneVersion}
              onChange={(e) => setCloneVersion(e.target.value)}
              placeholder="Version เช่น 2.0"
              className="rounded-md border border-blue-300 px-2 py-1 text-sm bg-white"
            />
            <input
              type="date"
              value={cloneDate}
              onChange={(e) => setCloneDate(e.target.value)}
              className="rounded-md border border-blue-300 px-2 py-1 text-sm bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={doClone}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 disabled:opacity-50"
            >
              <Copy className="h-3 w-3" />
              Clone เลย
            </button>
            <button
              onClick={() => setShowClone(false)}
              className="text-xs text-blue-700 hover:text-blue-900 px-2 py-1.5"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isNew ? "บันทึก Template" : "บันทึกการแก้ไข"}
        </button>

        {!isNew && (
          <>
            <button
              onClick={() => setShowClone(!showClone)}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Copy className="h-4 w-4" />
              Clone version ใหม่
            </button>
            <button
              onClick={toggleActive}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Power className="h-4 w-4" />
              {data.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            </button>
            <div className="flex-1" />
            {!usedInReports && (
              <button
                onClick={remove}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                ลบ
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
