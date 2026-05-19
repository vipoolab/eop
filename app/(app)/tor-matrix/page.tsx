import { PlaceholderPage } from "@/components/placeholder-page";

export default function TorMatrixPage() {
  return (
    <PlaceholderPage
      title="TOR Coverage Matrix"
      system="Meta — เพื่อตรวจสอบความครอบคลุม"
      torRefs={["All"]}
      description="ตารางอ้างอิงระหว่าง TOR clause กับ Web App screens — Transparency สำหรับกรรมการ"
      features={[
        "ทุก TOR clause (1-19 + ภาคผนวก ก-ง) → screen ใน web app",
        "Status: ✅ Live / 🔄 Scaffolded / ⏳ Pending",
        "Filter ตาม TOR section / Status / Priority",
        "Export to PDF สำหรับกรรมการ",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
