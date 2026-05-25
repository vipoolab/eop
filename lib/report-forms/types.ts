// Types for Dynamic Report Forms (แบบฟอร์มรายงาน)
// Forms are templates used as qualitative KPI evidence in command tracking.

export type FieldType =
  | "text"      // กล่องข้อความสั้น
  | "textarea"  // กล่องข้อความยาว
  | "number"    // ตัวเลข
  | "select"    // dropdown
  | "radio"     // single choice
  | "checkbox"  // multi-choice
  | "date"      // วันที่
  | "rating";   // คะแนน 1–5

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];       // for select/radio/checkbox
  validation?: {
    min?: number;           // for number / rating
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export type FormCategory =
  | "การปราบปราม"
  | "การสืบสวน"
  | "การป้องกัน"
  | "การจราจร"
  | "การอำนวยความสะดวก"
  | "การฝึกอบรม"
  | "ทั่วไป";

export const FORM_CATEGORIES: FormCategory[] = [
  "การปราบปราม",
  "การสืบสวน",
  "การป้องกัน",
  "การจราจร",
  "การอำนวยความสะดวก",
  "การฝึกอบรม",
  "ทั่วไป",
];

export interface ReportForm {
  id: string;
  name: string;
  description: string;
  category: FormCategory;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;        // persona id or "system"
  createdByName: string;
  version: number;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "ข้อความสั้น",
  textarea: "ข้อความยาว",
  number: "ตัวเลข",
  select: "เลือกจากรายการ (Dropdown)",
  radio: "เลือกได้ 1 ข้อ (Radio)",
  checkbox: "เลือกได้หลายข้อ (Checkbox)",
  date: "วันที่",
  rating: "คะแนน (1–5 ดาว)",
};
