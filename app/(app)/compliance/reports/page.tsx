import { PlaceholderPage } from "@/components/placeholder-page";

export default function ComplianceReportsPage() {
  return (
    <PlaceholderPage
      title="Compliance Reports"
      system="ระบบ 3: Compliance-based Module"
      torRefs={["5.4.3", "3.1"]}
      description="สร้างรายงานตามมาตรฐานราชการอัตโนมัติ — ก.พ.ร. / ITA / PMQA / รายงาน 4.0"
      features={[
        "3.1 รายงาน ก.พ.ร. (สำนักงาน ก.พ.ร.)",
        "3.1 รายงาน ITA (Integrity & Transparency Assessment)",
        "3.1 รายงาน PMQA (Public Management Quality Award)",
        "3.1 รายงานระบบราชการ 4.0",
        "Export PDF / DOCX",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
