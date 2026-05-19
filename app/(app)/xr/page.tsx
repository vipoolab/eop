import { PlaceholderPage } from "@/components/placeholder-page";

export default function XrCommandCenterPage() {
  return (
    <PlaceholderPage
      title="XR Command Center"
      system="ระบบ 5: XR Command Center — PoC 4"
      torRefs={["5.4.5", "5.1", "5.2", "5.7"]}
      description="ศูนย์ปฏิบัติการเสมือนจริง (Extended Reality) — แสดงผ่าน XR Headset"
      pocNumber={4}
      features={[
        "5.1 XR Headset Interface (Meta Quest 3+ หรือเทียบเท่า)",
        "5.2 Virtual Screens + Infinite Canvas",
        "5.3 Interaction — Mouse/Keyboard/Wireless Controller",
        "5.6 มุมมอง 360° (ส่วนกลาง/บช./บก./สน.)",
        "5.7 KPI Dashboard + GIS แผนที่",
        "5.10 Real-Time monitoring",
        "PoC 4: Virtual Screens 60-62 จอ + 4 chart types + Multi-window",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
