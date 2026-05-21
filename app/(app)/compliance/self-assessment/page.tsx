// Self-Assessment redirect — TOR ๓.๒ now embedded inside Compliance Report Detail
// Self-assessment = กรอกคำตอบ + selfScore ใน ComplianceReport (status=DRAFT)

import { redirect } from "next/navigation";

export default function SelfAssessmentPage() {
  // Self-Assessment ปัจจุบันรวมอยู่ในหน้า Report Detail (เมื่อ status=DRAFT, user เป็น STAFF)
  // → redirect ไปยังรายการ reports
  redirect("/compliance/reports");
}
