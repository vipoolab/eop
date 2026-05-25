// /intelligence/ocr — OCR ภาษาไทย (real AI vision)

import Link from "next/link";
import { ScanLine, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OcrDemo } from "./ocr-demo";

export const dynamic = "force-dynamic";

export default function OcrPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScanLine}
        eyebrow="PoC ๓ — TOR 3.5.3"
        title="OCR ภาษาไทย (AI Vision)"
        description="อ่านข้อความจาก PDF / รูปภาพ ด้วย AI Vision Engine คุณภาพสูง — รองรับเอกสารราชการ ภาษาไทย ตัวอักษรขนาด ≥ 10pt ที่ความละเอียด ≥ 300 dpi"
        live
        actions={
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ Hub
          </Link>
        }
      />

      <OcrDemo />
    </div>
  );
}
