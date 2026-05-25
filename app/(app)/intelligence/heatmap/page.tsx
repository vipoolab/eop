// /intelligence/heatmap — Geographic crime heatmap

import Link from "next/link";
import { Map, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listIncidents, countIncidentsByProvince } from "@/lib/intelligence/store";
import { HeatmapView } from "./heatmap-view";

export const dynamic = "force-dynamic";

export default function HeatmapPage() {
  const incidents = listIncidents();
  const byProvince = countIncidentsByProvince();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Map}
        eyebrow="ระบบ AI"
        title="Heatmap พื้นที่เสี่ยง"
        description="แผนที่จุดเสี่ยงเหตุการณ์ทั่วประเทศ — แสดงความหนาแน่นของเหตุการณ์ตามจังหวัด พร้อมตัวกรองตามประเภทคดีและระดับความรุนแรง"
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

      <HeatmapView incidents={incidents} byProvince={byProvince} />
    </div>
  );
}
