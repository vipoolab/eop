import { PlaceholderPage } from "@/components/placeholder-page";

export default function DocClassificationPage() {
  return (
    <PlaceholderPage
      title="AI Document Classification"
      system="ระบบ 6: Data & AI Management — PoC 2"
      torRefs={["5.4.6", "6.10.3"]}
      description="AI จำแนกเอกสาร 6 หมวด (ยศ. / ผบ. / มค. / มข. / วจ. / อจ.สยศ.ตร.) — PoC 2 (10 คะแนน)"
      pocNumber={2}
      live
      features={[
        "Upload DOCX/PDF/XLSX/JPG/PNG (5 formats ตาม TOR 6.10.3(ง))",
        "Zero-shot classification ด้วย Claude API",
        "Accuracy ≥ 85% (TOR 6.10.3(ก))",
        "6 หมวด: กองยุทธศาสตร์ / กองแผนงานอำนวยการ / กองแผนงานความมั่นคง / กองแผนงานกิจการพิเศษ / กองวิจัย / ฝ่ายอำนวยการ",
        "Document Preview เทียบกับ AI extract",
        "Edit + ปรับปรุง Text Extraction",
      ]}
      status="in-progress"
      scheduledDay={4}
    />
  );
}
