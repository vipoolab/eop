// /strategic/document/[id] — drill-down ดูเอกสารเดียว + items + child docs

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Sparkles,
  Library,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlanDocBadge } from "@/components/strategic/plan-tree";
import {
  getDocument,
  getItemsForDocument,
  buildItemTree,
  getChildDocuments,
} from "@/lib/strategic/store";
import { PLAN_LEVEL_LABELS } from "@/lib/strategic/types";
import type { PlanItem } from "@/lib/strategic/types";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) notFound();

  const items = getItemsForDocument(id);
  const itemTree = buildItemTree(items);
  const childDocs = getChildDocuments(id);
  const parent = doc.parentDocId ? getDocument(doc.parentDocId) : null;

  const Icon = doc.level === 1 ? Library : doc.level === 2 ? BookOpen : ClipboardList;

  return (
    <div className="space-y-6">
      <Link
        href="/strategic"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ คลังแผนยุทธศาสตร์
      </Link>

      <PageHeader
        icon={Icon}
        eyebrow={`${PLAN_LEVEL_LABELS[doc.level]} (ระดับ ${doc.level})`}
        title={doc.title}
        description={doc.description}
      />

      {/* Meta */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetaCard
          icon={Calendar}
          label="ระยะเวลา"
          value={
            doc.metadata?.startYear && doc.metadata?.endYear
              ? `พ.ศ. ${doc.metadata.startYear} - ${doc.metadata.endYear}`
              : "—"
          }
        />
        <MetaCard
          icon={User}
          label="ผู้จัดทำ"
          value={doc.metadata?.issuedBy ?? "—"}
        />
        <MetaCard
          icon={FileText}
          label="หน่วยงานเจ้าของ"
          value={doc.metadata?.agency ?? "—"}
        />
        <MetaCard
          icon={Sparkles}
          label="AI ที่ใช้"
          value={doc.parsedBy === "seed" ? "ข้อมูลตัวอย่าง" : doc.parsedBy ?? "—"}
        />
      </section>

      {/* Vision (if any) */}
      {doc.metadata?.vision && (
        <section className="bg-gradient-to-br from-[#1e3a5f]/[0.04] to-white border border-[#1e3a5f]/15 rounded-sm p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b8860b] mb-2">
            วิสัยทัศน์
          </div>
          <p className="text-base font-serif text-slate-900 italic leading-relaxed">
            “{doc.metadata.vision}”
          </p>
        </section>
      )}

      {/* Parent / child links */}
      {(parent || childDocs.length > 0) && (
        <section className="bg-white border border-slate-200 rounded-sm p-5">
          <h2 className="font-semibold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">
            ความสัมพันธ์
          </h2>
          {parent && (
            <div className="mb-3">
              <div className="text-xs text-slate-500 mb-1">อยู่ภายใต้</div>
              <Link
                href={`/strategic/document/${parent.id}`}
                className="inline-flex items-center gap-2 text-sm hover:underline"
              >
                <PlanDocBadge doc={parent} />
                <span className="font-medium">{parent.title}</span>
              </Link>
            </div>
          )}
          {childDocs.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">
                เอกสารระดับล่าง ({childDocs.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {childDocs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/strategic/document/${c.id}`}
                    className="rounded-sm border border-slate-200 hover:border-[#1e3a5f] hover:bg-slate-50 p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <PlanDocBadge doc={c} />
                    </div>
                    <div className="font-medium text-slate-900 line-clamp-2">
                      {c.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Items */}
      <section className="bg-white border border-slate-200 rounded-sm p-5">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="font-semibold text-slate-900">
            โครงสร้างเนื้อหา ({items.length} ข้อ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI ดึงโครงสร้างเป็นลำดับชั้นจากเอกสารต้นฉบับ
          </p>
        </div>
        {itemTree.length > 0 ? (
          <div className="space-y-1">
            {itemTree.map((item) => (
              <ItemRow key={item.id} item={item} depth={0} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 text-center py-8">
            ไม่มีข้อในเอกสารนี้
          </div>
        )}
      </section>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2">
        {value}
      </div>
    </div>
  );
}

function ItemRow({ item, depth }: { item: PlanItem; depth: number }) {
  const hasChildren = (item.children?.length ?? 0) > 0;

  return (
    <div
      style={{ marginLeft: `${depth * 16}px` }}
      className={`rounded-sm ${depth === 0 ? "bg-slate-50 border border-slate-200" : "border-l-2 border-slate-200"} p-3`}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono text-xs text-[#1e3a5f] font-semibold bg-white px-1.5 py-0.5 rounded shrink-0">
          {item.number}
        </span>
        <h3 className={`font-semibold ${depth === 0 ? "text-base" : "text-sm"} text-slate-900`}>
          {item.name}
        </h3>
      </div>
      {item.description && (
        <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">
          {item.description}
        </p>
      )}
      {item.meta && (item.meta.kpi || item.meta.owner || item.meta.targetYear) && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {item.meta.owner && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800">
              ผู้รับผิดชอบ: {item.meta.owner}
            </span>
          )}
          {item.meta.targetYear && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-blue-50 border border-blue-200 text-blue-800">
              เป้าหมายปี {item.meta.targetYear}
            </span>
          )}
          {item.meta.kpi && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800">
              KPI: {item.meta.kpi}
            </span>
          )}
        </div>
      )}
      {hasChildren && (
        <div className="mt-2 space-y-1">
          {item.children!.map((child) => (
            <ItemRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
