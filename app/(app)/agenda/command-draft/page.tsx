import { PlaceholderPage } from "@/components/placeholder-page";

export default function CommandDraftPage() {
  return (
    <PlaceholderPage
      title="AI ร่างหนังสือสั่งการ"
      system="ระบบ 2: Agenda-based Module — PoC 1"
      torRefs={["5.4.2", "2.2"]}
      description="Generative AI ช่วยร่างหนังสือสั่งการจาก 5 keywords — PoC 1 (5 คะแนน)"
      pocNumber={1}
      live
      features={[
        "Input: 5 รายการ (หัวเรื่อง / หน่วยงาน / วัตถุประสงค์ / ข้อสั่งการ / ระยะเวลา)",
        "Output: ร่างหนังสือสั่งการเต็มรูปแบบ (หัว / ที่ / เรื่อง / เรียน / อ้างถึง / เนื้อหา / ลงนาม)",
        "2.2.2 รองรับ 4 กรณี (ก่อเหตุ / อันตรายร้ายแรง / งานสำคัญพิเศษ / งานพิเศษอื่นๆ)",
        "Cache result + Streaming response",
      ]}
      status="in-progress"
      scheduledDay={3}
    />
  );
}
