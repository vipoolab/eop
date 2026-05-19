import { PlaceholderPage } from "@/components/placeholder-page";

export default function StrategicAlignmentPage() {
  return (
    <PlaceholderPage
      title="Strategic Alignment"
      system="ระบบ 1: Strategic-based Module"
      torRefs={["5.4.1", "1.1", "1.2"]}
      description="AI วิเคราะห์ความสอดคล้องของแผน 3 ระดับ (ยุทธศาสตร์ชาติ / แผนแม่บท / แผนปฏิบัติราชการ)"
      features={[
        "1.1.1 NLP เรียนรู้บริบทและความสัมพันธ์ของแผนแต่ละระดับ",
        "1.1.2 รองรับการนำเข้าแผน 3 ระดับ (Structured Data)",
        "1.2.1 Draft Recommendation — แนะนำการปรับแก้ไขข้อความ",
        "1.2.2 Strategic Plan Management — Import + Create + Cascading Goals",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
