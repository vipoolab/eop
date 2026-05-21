// OCR Demo Page — TOR 5.4.6 / 6.10.3(ค) PoC #3

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { OcrForm } from "./ocr-form";
import { ScanText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OcrPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={ScanText}
        eyebrow="Data & AI · OCR"
        title="OCR ภาษาไทย — สกัดข้อความจากภาพ"
        description="อัปโหลดภาพ (JPG/PNG) หรือ PDF (สูงสุด 30 หน้า) → AI Opus 4.5 อ่านและสกัดข้อความ"
        live
      />

      <OcrForm />
    </div>
  );
}
