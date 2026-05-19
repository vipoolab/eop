import { PlaceholderPage } from "@/components/placeholder-page";

export default function MissionsPage() {
  return (
    <PlaceholderPage
      title="Mission & Agenda Management"
      system="ระบบ 2: Agenda-based Module"
      torRefs={["5.4.2", "2.1"]}
      description="บริหารวาระและภารกิจสำคัญของ ตร. — กำหนดเป้าหมาย ตัวชี้วัด และผู้รับผิดชอบ"
      features={[
        "2.1.1 AI-Assisted Command Drafting",
        "2.1.2 กำหนดเป้าหมายและขอบเขตภารกิจ",
        "2.1.3 Targeting & Cascading + ตัวชี้วัด",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
