import { PlaceholderPage } from "@/components/placeholder-page";

export default function KpiCascadingPage() {
  return (
    <PlaceholderPage
      title="KPI Cascading"
      system="ระบบ 1: Strategic-based Module"
      torRefs={["5.4.1", "1.2.2", "1.3"]}
      description="ตัวชี้วัด (KPI) ถ่ายทอดเชิงน้ำตก (Cascading Goals) จาก ตร. ลงไปยังหน่วยงานย่อย"
      features={[
        "1.2.2(ข) Cascading Goals + KPI",
        "1.3(ก) Data Visualization — แสดง KPIs",
        "1.3(ข) Drill-down รายหน่วยงาน + รายพื้นที่",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
