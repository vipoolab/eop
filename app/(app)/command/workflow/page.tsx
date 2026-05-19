import { PlaceholderPage } from "@/components/placeholder-page";

export default function CommandWorkflowPage() {
  return (
    <PlaceholderPage
      title="Command Workflow"
      system="ระบบ 4: Command & Operation System"
      torRefs={["5.4.4", "4.1", "4.3", "4.5", "4.7"]}
      description="วงจรคำสั่ง 9 สถานะ + Read Receipt + Smart Notification + Auto-Escalation"
      features={[
        "4.1 วงจร 9 สถานะ: ร่าง → เสนอ → อนุมัติ → เผยแพร่ → การจ่ายคำสั่ง → รับทราบ → เริ่มปฏิบัติ → ส่งผลหลักฐาน → ปิดงาน/ประเมินผล",
        "4.1 ลายเซ็นอิเล็กทรอนิกส์ (e-Signature)",
        "4.3 Read Receipt / Acknowledgement (ใคร / เมื่อไหร่)",
        "4.5 การกระจายคำสั่ง + ตั้งเป้าหมาย + ตัวชี้วัด",
        "4.7 Smart Notification + Auto-Escalation",
        "4.9 Dashboard Real-Time",
      ]}
      status="in-progress"
      scheduledDay={2}
    />
  );
}
