import { PlaceholderPage } from "@/components/placeholder-page";

export default function IntelligentSearchPage() {
  return (
    <PlaceholderPage
      title="Intelligent Search"
      system="ระบบ 6: Data & AI Management"
      torRefs={["5.4.6", "6.10.11"]}
      description="ค้นหา 4 โหมด — Basic / Advanced / Full-text / Semantic (เข้าใจความหมาย)"
      live
      features={[
        "6.10.11(ก) Basic Search — Keyword matching",
        "6.10.11(ข) Advanced Search — filter ตามเงื่อนไข",
        "6.10.11(ค) Full-Text & Content Search — รองรับ PDF / Word / ภาพ OCR",
        "6.10.11(ง) Semantic Search — เข้าใจความหมาย (AI Embedding)",
        "RBAC filter (ผู้ใช้เห็นเฉพาะเอกสารที่มีสิทธิ์)",
      ]}
      status="in-progress"
      scheduledDay={5}
    />
  );
}
