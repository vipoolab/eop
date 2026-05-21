// Evidence Library — รวมเอกสารหลักฐานที่ใช้ใน Compliance
// TOR ๓.๑/๓.๒ — เก็บคลังหลักฐานใช้ซ้ำปีต่อปี

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { FolderOpen, FileText, ArrowLeft, Search } from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_COLORS,
  type ComplianceStandard,
} from "@/features/compliance/types";

export const dynamic = "force-dynamic";

export default async function EvidenceLibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Documents that are linked as evidence to ComplianceAnswers
  const evidences = await prisma.complianceAnswer.findMany({
    where: { evidenceDocId: { not: null } },
    distinct: ["evidenceDocId"],
    include: {
      evidenceDoc: {
        select: { id: true, filename: true, originalName: true, mimeType: true, size: true, createdAt: true },
      },
      report: {
        select: {
          template: { select: { code: true, name: true, standard: true } },
          period: true,
        },
      },
    },
    take: 100,
  });

  // Count usage per document
  const usageMap = new Map<string, number>();
  for (const e of evidences) {
    if (!e.evidenceDocId) continue;
    usageMap.set(e.evidenceDocId, (usageMap.get(e.evidenceDocId) ?? 0) + 1);
  }

  // Unique documents
  const seen = new Set<string>();
  const unique = evidences.filter((e) => {
    if (!e.evidenceDocId || seen.has(e.evidenceDocId)) return false;
    seen.add(e.evidenceDocId);
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/compliance"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังภาพรวม
      </Link>

      <PageHeader
        icon={FolderOpen}
        eyebrow="Compliance · Evidence"
        title="คลังหลักฐาน"
        description={`เอกสารหลักฐานที่เคยใช้ใน Compliance ${unique.length} รายการ — ใช้ซ้ำในรายงานปีต่อไปได้`}
      />

      {/* Search bar (placeholder, server-side filter หลังจาก demo) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาตามชื่อเอกสาร / มาตรฐาน / ปี"
          className="flex-1 bg-transparent text-sm outline-none"
          disabled
        />
        <span className="text-[10px] text-slate-400">(coming soon)</span>
      </div>

      {unique.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-1">ยังไม่มีหลักฐานในคลัง</p>
          <p className="text-[11px] text-slate-400">
            หลักฐานจะถูกเพิ่มอัตโนมัติเมื่อมีการแนบในรายงาน Compliance
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {unique.map((e) => {
            const doc = e.evidenceDoc!;
            const std = e.report.template.standard as ComplianceStandard;
            const usage = usageMap.get(doc.id) ?? 1;
            return (
              <div
                key={doc.id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1 truncate">
                      📄 {doc.originalName}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}>
                        {STANDARD_LABELS[std]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {e.report.period}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {doc.mimeType} · {(doc.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ใช้แล้ว <strong>{usage}</strong> ครั้ง · อัปโหลด{" "}
                      {new Date(doc.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
