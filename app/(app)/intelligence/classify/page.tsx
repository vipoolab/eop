// /intelligence/classify — Document classification

import Link from "next/link";
import { Tags, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listDocuments } from "@/lib/intelligence/store";
import { DOC_CATEGORIES, CATEGORY_STYLES } from "@/lib/intelligence/types";
import { ClassifyDemo } from "./classify-demo";

export const dynamic = "force-dynamic";

export default function ClassifyPage() {
  const recent = listDocuments()
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      title: d.title,
      fileName: d.fileName,
      category: d.category,
      confidence: d.classifierConfidence,
      summary: d.summary,
      extractedText: d.extractedText.slice(0, 240),
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tags}
        eyebrow="ระบบ AI"
        title="จำแนกประเภทเอกสารอัตโนมัติ"
        description="AI Classifier วิเคราะห์เอกสารและจัดเข้า ๑๑ หมวด ตามประเภทงาน (TOR EOP ข้อ ๔) โดยใช้คีย์เวิร์ดและเนื้อหา"
        live
        actions={
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      {/* Category legend — 11 work-type categories per TOR */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {DOC_CATEGORIES.map((cat) => (
          <div
            key={cat}
            className={`rounded-sm border px-3 py-2 text-center text-xs font-semibold leading-tight ${CATEGORY_STYLES[cat]}`}
          >
            {cat}
          </div>
        ))}
      </div>

      <ClassifyDemo recent={recent} />
    </div>
  );
}
