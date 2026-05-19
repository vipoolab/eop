import { PlaceholderPage } from "@/components/placeholder-page";

export default function SelfAssessmentPage() {
  return (
    <PlaceholderPage
      title="Self-Assessment"
      system="ระบบ 3: Compliance-based Module"
      torRefs={["5.4.3", "3.2"]}
      description="ประเมินตนเองตามมาตรฐาน ก.พ.ร./ITA/PMQA ก่อนส่งหน่วยประเมินภายนอก"
      features={[
        "3.2 กระบวนการประเมินตนเอง (Self-Assessment)",
        "Checklist ตามเกณฑ์ของแต่ละมาตรฐาน",
        "คะแนนคาดการณ์ก่อนส่งจริง",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
