"use client";

// Collapsible tree of plan items / documents
// Levels visualized:
//   PlanTreeNode (document) → contains PlanItems → may contain childDocs

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Library,
  ClipboardList,
  BookOpen,
  Target,
} from "lucide-react";
import type { PlanDocument, PlanItem, PlanTreeNode } from "@/lib/strategic/types";
import { PLAN_LEVEL_LABELS } from "@/lib/strategic/types";

interface PlanTreeProps {
  root: PlanTreeNode;
}

export function PlanTree({ root }: PlanTreeProps) {
  return (
    <div className="space-y-2 text-sm">
      <DocNode node={root} initialOpen={true} />
    </div>
  );
}

function levelIcon(level: 1 | 2 | 3) {
  if (level === 1) return Library;
  if (level === 2) return BookOpen;
  return ClipboardList;
}

function levelColor(level: 1 | 2 | 3) {
  if (level === 1) return "border-[#1e3a5f] bg-[#1e3a5f]/[0.04] text-[#1e3a5f]";
  if (level === 2) return "border-[#b8860b] bg-[#b8860b]/[0.04] text-[#92400e]";
  return "border-slate-400 bg-slate-50 text-slate-700";
}

interface DocNodeProps {
  node: PlanTreeNode;
  initialOpen?: boolean;
}

function DocNode({ node, initialOpen = false }: DocNodeProps) {
  const [open, setOpen] = useState(initialOpen);
  const Icon = levelIcon(node.level);
  const color = levelColor(node.level);
  const hasChildren = node.items.length > 0 || node.childDocs.length > 0;

  return (
    <div className={`rounded-sm border ${color}`}>
      <div className="flex items-start gap-2 px-3 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 shrink-0 hover:opacity-70"
          disabled={!hasChildren}
          aria-label={open ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="block h-3.5 w-3.5" />
          )}
        </button>
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
              {PLAN_LEVEL_LABELS[node.level]}
            </span>
            {node.isSeed && (
              <span className="text-[9px] uppercase font-semibold px-1 py-px rounded-sm bg-slate-200 text-slate-600">
                ตัวอย่าง
              </span>
            )}
          </div>
          <Link
            href={`/strategic/document/${node.id}`}
            className="block font-semibold leading-tight hover:underline mt-0.5"
          >
            {node.title}
          </Link>
          {node.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-snug">
              {node.description}
            </p>
          )}
          <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
            <span>
              <strong>{node.itemCount}</strong> ข้อในเอกสาร
            </span>
            <span>
              ทั้งสาขา <strong>{node.totalItemCount}</strong> ข้อ
            </span>
            {node.childDocs.length > 0 && (
              <span>
                <strong>{node.childDocs.length}</strong> เอกสารระดับล่าง
              </span>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-current/10 px-3 py-2 space-y-2 bg-white/40">
          {node.items.length > 0 && (
            <div className="space-y-0.5">
              {node.items.map((item) => (
                <ItemNode key={item.id} item={item} depth={0} />
              ))}
            </div>
          )}
          {node.childDocs.length > 0 && (
            <div className="space-y-2 mt-2">
              {node.childDocs.map((child) => (
                <DocNode key={child.id} node={child} initialOpen={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ItemNodeProps {
  item: PlanItem;
  depth: number;
}

function ItemNode({ item, depth }: ItemNodeProps) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (item.children?.length ?? 0) > 0;

  return (
    <div
      style={{ paddingLeft: `${depth * 12}px` }}
      className="text-[13px]"
    >
      <div className="flex items-start gap-1.5 py-1 hover:bg-slate-50/80 rounded px-1">
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <Target className="h-3 w-3 text-slate-300" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-slate-500 text-[11px] shrink-0">{item.number}</span>
            <span className="font-medium text-slate-800">{item.name}</span>
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5 ml-0">{item.description}</p>
          )}
          {item.meta && (item.meta.kpi || item.meta.owner) && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {item.meta.owner && (
                <span className="text-[10px] px-1 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800">
                  {item.meta.owner}
                </span>
              )}
              {item.meta.kpi && (
                <span className="text-[10px] text-slate-500 italic">
                  KPI: {item.meta.kpi}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {open && hasChildren && (
        <div className="ml-2 border-l-2 border-slate-100">
          {item.children!.map((child) => (
            <ItemNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Lite version for previews / summary lists
export function PlanDocBadge({ doc }: { doc: PlanDocument }) {
  const Icon = levelIcon(doc.level);
  const color = levelColor(doc.level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
    >
      <Icon className="h-3 w-3" />
      {PLAN_LEVEL_LABELS[doc.level]}
    </span>
  );
}
