import { PlaceholderPage } from "@/components/placeholder-page";

export default function DocClassificationPage() {
  return (
    <PlaceholderPage
      title="AI Document Classification"
      system="Data & AI"
      description="AI จำแนกเอกสาร 6 หมวด (ยศ. / ผบ. / มค. / มข. / วจ. / อจ.สยศ.ตร.)"
      pocNumber={2}
      live
      features={[
        "อัปโหลดไฟล์ DOCX / PDF / XLSX / JPG / PNG (5 รูปแบบ)",
        "Zero-shot classification ด้วย Claude API",
        "ความแม่นยำเป้าหมาย ≥ 85%",
        "6 หมวดงาน: กองยุทธศาสตร์ / กองแผนงานอำนวยการ / กองแผนงานความมั่นคง / กองแผนงานกิจการพิเศษ / กองวิจัย / ฝ่ายอำนวยการ",
        "Document Preview เทียบกับ AI extract",
        "Edit + ปรับปรุงข้อความที่สกัดได้",
      ]}
      status="in-progress"
      scheduledDay={4}
    />
  );
}
