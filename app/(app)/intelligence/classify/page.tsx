// /intelligence/classify — Document classification

import Link from "next/link";
import { Tags, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listDocuments } from "@/lib/intelligence/store";
import { DOC_CATEGORIES, CATEGORY_DESCRIPTIONS } from "@/lib/intelligence/types";
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
        description="AI Classifier วิเคราะห์เอกสารและจัดเข้า ๖ หมวด (ยศ./ผบ./มค./มข./วจ./อจ.) โดยใช้คีย์เวิร์ดและเนื้อหา"
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

      {/* Category legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {DOC_CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-center"
          >
            <div className="text-lg font-bold text-[#1e3a5f]">{cat}</div>
            <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
              {CATEGORY_DESCRIPTIONS[cat]}
            </div>
          </div>
        ))}
      </div>

      <ClassifyDemo recent={recent} />
    </div>
  );
}
