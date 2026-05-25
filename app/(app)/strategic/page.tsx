// คลังแผนยุทธศาสตร์ — Hub page
// ภาพรวม: Hierarchy Dashboard (default) + Tree view (collapsible)

import Link from "next/link";
import { Library, Upload, FileText, ListTree } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlanTree } from "@/components/strategic/plan-tree";
import { PlanSummary } from "@/components/strategic/plan-summary";
import { HierarchyDashboard } from "@/components/strategic/hierarchy-dashboard";
import {
  buildDocTree,
  getStats,
  listDocuments,
  getItemsForDocument,
} from "@/lib/strategic/store";
import {
  buildHierarchy,
  computeStats as computeHierStats,
} from "@/lib/strategic/hierarchy";
import type { PlanItem } from "@/lib/strategic/types";

export const dynamic = "force-dynamic";

export default async function StrategicHubPage() {
  const tree = buildDocTree();
  const stats = getStats();
  const allDocs = listDocuments();

  // Gather all items across all documents (for hierarchy computation)
  const allItems: PlanItem[] = allDocs.flatMap((d) => getItemsForDocument(d.id));

  const hierarchy = buildHierarchy(allDocs, allItems);
  const hierStats = computeHierStats(hierarchy, allItems);

  // Precompute item counts per doc
  const itemCounts: Record<string, number> = {};
  for (const d of allDocs) {
    itemCounts[d.id] = allItems.filter((i) => i.documentId === d.id).length;
  }

  const orphanDocs = allDocs.filter(
    (d) => d.level !== 1 && d.parentDocId === null
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Library}
        eyebrow="แผนยุทธศาสตร์"
        title="คลังแผนยุทธศาสตร์"
        description="รวมแผนระดับชาติ แผนแม่บท และแผนปฏิบัติราชการของสำนักงานตำรวจแห่งชาติ ในรูปแบบลำดับชั้นที่ AI ดึงโครงสร้างจากไฟล์ต้นฉบับ"
        actions={
          <div className="flex gap-2">
            <Link
              href="/strategic/upload"
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              อัปโหลดแผน
            </Link>
          </div>
        }
      />

      <PlanSummary stats={stats} tree={tree} />

      <section>
        <SectionTitle
          title="โครงสร้างแผน 3 ระดับ"
          description="คลิกเพื่อสำรวจความสัมพันธ์จากยุทธศาสตร์ชาติลงไปถึงแผนปฏิบัติราชการ"
        />
        <HierarchyDashboard
          data={hierarchy}
          stats={hierStats}
          itemCounts={itemCounts}
        />
      </section>

      {/* Tree view (collapsible alternate) */}
      {tree && (
        <details className="bg-white border border-slate-200 rounded-sm">
          <summary className="cursor-pointer select-none px-5 py-3 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ListTree className="h-4 w-4" />
              ดูเป็นลำดับชั้นแบบ Tree (expand all)
            </div>
            <span className="text-xs text-slate-500">คลิกเพื่อเปิด/ปิด</span>
          </summary>
          <div className="p-5">
            <PlanTree root={tree} />
          </div>
        </details>
      )}

      {/* Orphan warnings */}
      {orphanDocs.length > 0 && (
        <div className="rounded-sm border border-amber-300 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900 mb-2">
            ⚠ เอกสารที่ยังไม่ได้แมพกับแผน parent ({orphanDocs.length} ฉบับ)
          </div>
          <div className="space-y-1">
            {orphanDocs.map((d) => (
              <Link
                key={d.id}
                href={`/strategic/document/${d.id}`}
                className="block text-sm text-amber-800 hover:underline"
              >
                <FileText className="inline h-3 w-3 mr-1" />
                {d.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}
