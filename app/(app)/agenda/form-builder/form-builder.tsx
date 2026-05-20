"use client";

// Real drag-drop form builder using @dnd-kit
// Drag field types from palette → drop into canvas → reorder

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  Hash,
  Calendar,
  ChevronDown,
  Paperclip,
  GripVertical,
  Trash2,
  Plus,
  Eye,
  Save,
  CheckCircle2,
} from "lucide-react";

type FieldType = "text" | "number" | "date" | "select" | "file" | "textarea";

interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
}

const FIELD_TYPES: Array<{ type: FieldType; icon: typeof Type; label: string; desc: string }> = [
  { type: "text", icon: Type, label: "ข้อความสั้น", desc: "Text input" },
  { type: "textarea", icon: Type, label: "ข้อความยาว", desc: "Multi-line text" },
  { type: "number", icon: Hash, label: "ตัวเลข", desc: "Number" },
  { type: "date", icon: Calendar, label: "วันที่", desc: "Date picker" },
  { type: "select", icon: ChevronDown, label: "Dropdown", desc: "Select option" },
  { type: "file", icon: Paperclip, label: "ไฟล์แนบ", desc: "File upload" },
];

const TEMPLATES = [
  { name: "รายงานผลการปฏิบัติงาน รายไตรมาส", fields: 12 },
  { name: "แบบสำรวจอัตรากำลัง", fields: 8 },
  { name: "แบบประเมิน ก.พ.ร.", fields: 15 },
  { name: "แบบรายงานเหตุการณ์", fields: 10 },
  { name: "แบบฟอร์มขอรับสวัสดิการ", fields: 14 },
  { name: "แบบรายงานคดี", fields: 18 },
];

const STARTER_FIELDS: Field[] = [
  { id: "f1", type: "text", label: "ชื่อหน่วยปฏิบัติ", required: true },
  { id: "f2", type: "date", label: "วันที่รายงาน", required: true },
  { id: "f3", type: "select", label: "ไตรมาส", required: true },
  { id: "f4", type: "textarea", label: "ผลการดำเนินงานโดยสรุป", required: false },
];

export function FormBuilder() {
  const [fields, setFields] = useState<Field[]>(STARTER_FIELDS);
  const [formName, setFormName] = useState("แบบรายงานผลการปฏิบัติงาน รายไตรมาส");
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFields((items) => {
      const oldIndex = items.findIndex((f) => f.id === active.id);
      const newIndex = items.findIndex((f) => f.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function addField(type: FieldType) {
    const meta = FIELD_TYPES.find((t) => t.type === type)!;
    const newField: Field = {
      id: `f${Date.now()}`,
      type,
      label: meta.label,
      required: false,
    };
    setFields([...fields, newField]);
  }

  function deleteField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
  }

  function updateField(id: string, patch: Partial<Field>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function save() {
    // In production: POST to /api/forms
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function loadTemplate(name: string) {
    setFormName(name);
    // In production: load template field configuration
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* Left: Field palette + Templates */}
      <div className="space-y-4">
        <div className="rounded-sm border border-slate-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            เพิ่มฟิลด์
          </h3>
          <div className="space-y-1.5">
            {FIELD_TYPES.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.type}
                  onClick={() => addField(f.type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm border border-slate-200 bg-slate-50 hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f]/30 transition-colors text-left"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                  <Icon className="h-4 w-4 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-slate-500">{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-sm border border-slate-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            เทมเพลตพร้อมใช้
          </h3>
          <div className="space-y-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => loadTemplate(t.name)}
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

      {/* Right: Canvas */}
      <div className="lg:col-span-3 space-y-3">
        <div className="rounded-sm border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-lg font-semibold text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-[#1e3a5f] outline-none flex-1 mr-3"
            />
            <button
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-3 py-1.5 text-sm font-semibold text-white"
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "บันทึกแล้ว" : "บันทึก"}
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {fields.length === 0 ? (
                  <div className="rounded-sm border-2 border-dashed border-slate-300 p-12 text-center text-slate-400">
                    <FormIcon />
                    <p className="text-sm mt-3">ยังไม่มีฟิลด์ — กดเพิ่มจากด้านซ้าย</p>
                  </div>
                ) : (
                  fields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      onUpdate={(patch) => updateField(field.id, patch)}
                      onDelete={() => deleteField(field.id)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-4 flex items-start gap-2">
          <Eye className="h-4 w-4 text-[#b8860b] mt-0.5 shrink-0" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-[#b8860b]">No-Code Form Builder</strong> · ลากเรียงฟิลด์
            ได้แบบ drag-drop · {fields.length} ฟิลด์ · บันทึกแล้วใช้ใน Workflow ได้ทันที
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableField({
  field,
  onUpdate,
  onDelete,
}: {
  field: Field;
  onUpdate: (patch: Partial<Field>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const meta = FIELD_TYPES.find((t) => t.type === field.type);
  const Icon = meta?.icon ?? Type;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-sm border border-slate-200 bg-white hover:border-[#1e3a5f]/30 transition-colors group"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-slate-500 shrink-0" />
        <input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="flex-1 text-sm font-medium text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-200 focus:border-[#1e3a5f] outline-none"
        />
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="accent-[#1e3a5f]"
          />
          จำเป็น
        </label>
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {/* Preview of input */}
      <div className="px-3 pb-3 pl-9">
        {field.type === "textarea" ? (
          <div className="h-12 rounded-sm border border-slate-200 bg-slate-50" />
        ) : field.type === "select" ? (
          <div className="h-7 rounded-sm border border-slate-200 bg-slate-50 flex items-center justify-between px-2 text-xs text-slate-400">
            <span>เลือก...</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        ) : (
          <div className="h-7 rounded-sm border border-slate-200 bg-slate-50" />
        )}
      </div>
    </div>
  );
}

function FormIcon() {
  return (
    <svg className="h-10 w-10 mx-auto opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
