import { PlaceholderPage } from "@/components/placeholder-page";

export default function OcrPage() {
  return (
    <PlaceholderPage
      title="OCR ภาษาไทย"
      system="ระบบ 6: Data & AI Management — PoC 3"
      torRefs={["5.4.6", "6.10.3"]}
      description="OCR ดึงข้อความจาก PDF ภาษาไทย — PoC 3 (10 คะแนน)"
      pocNumber={3}
      live
      features={[
        "Input: PDF ≥ 300 dpi, ตัวอักษร ≥ 10 point",
        "OCR Pipeline: Claude Vision หรือ PaddleOCR",
        "คำนวณ CER (Character Error Rate)",
        "CER ≤ 10% = 10 pt / 10-20% = 5 pt / 20-30% = 2.5 pt / > 30% = 0",
        "Side-by-side: ภาพต้นฉบับ + ข้อความที่ดึง",
      ]}
      status="in-progress"
      scheduledDay={5}
    />
  );
}
