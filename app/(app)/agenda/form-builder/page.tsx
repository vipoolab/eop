import { PlaceholderPage } from "@/components/placeholder-page";

export default function FormBuilderPage() {
  return (
    <PlaceholderPage
      title="Dynamic Form Builder"
      system="ระบบ 2: Agenda-based Module"
      torRefs={["5.4.2", "2.3"]}
      description="สร้างแบบฟอร์มรายงานแบบ Drag & Drop (No-Code) — สำหรับ admin หน่วยงาน"
      features={[
        "2.3.1 Dynamic Form Builder — No-Code / Drag & Drop",
        "2.3.4 แบบรายงานตั้งต้น ≥ 10 แบบ",
        "Field types: text / number / date / dropdown / file upload",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
