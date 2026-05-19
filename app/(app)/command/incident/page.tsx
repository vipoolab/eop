import { PlaceholderPage } from "@/components/placeholder-page";

export default function IncidentManagementPage() {
  return (
    <PlaceholderPage
      title="Incident Management"
      system="ระบบ 4: Command & Operation + ระบบ 6: Data & AI"
      torRefs={["5.4.4", "5.4.6", "6.4"]}
      description="จัดการเหตุการณ์ — เชื่อมต่อ API ภายนอก (ศูนย์ 191 / CCTV / ข่าวกรอง)"
      features={[
        "6.4.2 Integration: ศูนย์รับแจ้งเหตุ 191",
        "6.4.2 Integration: ระบบกล้องวงจรปิด (CCTV)",
        "6.4.2 Integration: ระบบข่าวกรอง",
        "Heatmap เหตุการณ์เชิงพื้นที่",
        "Timeline สถานการณ์",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
