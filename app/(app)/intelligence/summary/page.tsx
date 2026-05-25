// /intelligence/summary — Executive Summary AI

import Link from "next/link";
import { FileBarChart, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listSummaries } from "@/lib/intelligence/store";
import { SummaryGenerator } from "./summary-generator";

export const dynamic = "force-dynamic";

export default function SummaryPage() {
  const summaries = listSummaries();
  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileBarChart}
        eyebrow="ระบบ AI"
        title="สรุปผู้บริหาร (AI Executive Summary)"
        description="AI วิเคราะห์ข้อมูลภาพรวมและสรุปเป็นรายงานระดับผู้บริหาร — Headline, Key Findings, Trends, Recommendations"
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

      <SummaryGenerator initialSummaries={summaries} />
    </div>
  );
}
