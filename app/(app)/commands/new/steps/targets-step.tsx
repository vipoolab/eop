"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";
import type { OrgUnit, Persona } from "@/lib/police-org/types";
import type { CascadeMode } from "@/lib/commands/types";

interface OrgTreeNode extends OrgUnit {
  children: OrgTreeNode[];
}

interface OrgData {
  tree: OrgTreeNode;
  activePersona: { persona: Persona; unit: OrgUnit | null };
  commandableUnitIds: string[];
}

interface Props {
  selectedIds: string[];
  cascadeMode: CascadeMode;
  onChange: (ids: string[], mode: CascadeMode) => void;
  /** AI-suggested recipients text (from drafted letter) — shown as info banner */
  aiSuggestedFrom?: string;
  /** Did AI pre-fill these targets? */
  aiPrefilled?: boolean;
}

export function TargetsStep({ selectedIds, cascadeMode, onChange, aiSuggestedFrom, aiPrefilled }: Props) {
  const [data, setData] = useState<OrgData | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((j) => {
        setData(j.data);
        // Auto-expand the persona's unit + its parents
        const exp = new Set<string>();
        const personaUnitId = j.data?.activePersona?.persona?.unitId;
        if (personaUnitId) exp.add(personaUnitId);
        // Also expand top-level for visibility
        if (j.data.tree?.id) exp.add(j.data.tree.id);
        setExpanded(exp);
      })
      .catch(() => {});
  }, []);

  const commandableSet = useMemo(
    () => new Set(data?.commandableUnitIds ?? []),
    [data]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Compute effective units: in CASCADE, descendants are also affected
  const effectiveCount = useMemo(() => {
    if (!data) return 0;
    if (cascadeMode === "DIRECT") return selectedIds.length;
    // Walk tree, count descendants of each selected unit
    const set = new Set<string>(selectedIds);
    const walk = (node: OrgTreeNode, ancestorSelected: boolean) => {
      const isAncestor = ancestorSelected || set.has(node.id);
      if (isAncestor) set.add(node.id);
      for (const c of node.children) walk(c, isAncestor);
    };
    walk(data.tree, false);
    return set.size;
  }, [data, selectedIds, cascadeMode]);

  // Breakdown: how many of each level
  const effectiveBreakdown = useMemo(() => {
    if (!data) return { bureaus: 0, divisions: 0, stations: 0 };
    const set = new Set<string>(selectedIds);
    const all: OrgTreeNode[] = [];
    const walk = (node: OrgTreeNode, ancestorSelected: boolean) => {
      const isAncestor = cascadeMode === "CASCADE" && (ancestorSelected || set.has(node.id));
      if (cascadeMode === "DIRECT" ? set.has(node.id) : isAncestor) {
        set.add(node.id);
        all.push(node);
      }
      for (const c of node.children) walk(c, isAncestor);
    };
    walk(data.tree, false);
    return {
      bureaus: all.filter((u) => u.level === 0 || u.level === 1).length,
      divisions: all.filter((u) => u.level === 2).length,
      stations: all.filter((u) => u.level === 3).length,
    };
  }, [data, selectedIds, cascadeMode]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelect(id: string) {
    if (!commandableSet.has(id)) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next), cascadeMode);
  }

  function expandAll() {
    if (!data) return;
    const all = new Set<string>();
    const walk = (n: OrgTreeNode) => {
      all.add(n.id);
      n.children.forEach(walk);
    };
    walk(data.tree);
    setExpanded(all);
  }

  function collapseAll() {
    setExpanded(new Set([data?.tree.id ?? ""]));
  }

  if (!data) {
    return <div className="text-sm text-slate-500">กำลังโหลดผังหน่วยงาน...</div>;
  }

  const matchesSearch = (u: OrgUnit) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.code.toLowerCase().includes(search.toLowerCase()) ||
    (u.province ?? "").includes(search);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
          ขั้นที่ ๓
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          เลือกหน่วยรับคำสั่ง
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          ผู้สั่งปัจจุบัน:{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {data.activePersona.persona.rank}{" "}
            {data.activePersona.persona.name.split(" ").slice(1).join(" ")}
          </span>{" "}
          ({data.activePersona.persona.role})
        </p>
      </div>

      {/* AI Pre-fill banner */}
      {aiPrefilled && selectedIds.length > 0 && (
        <div className="rounded-sm border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3.5">
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                AI Engine กำหนดหน่วยรับให้แล้ว ({selectedIds.length} หน่วย)
              </div>
              {aiSuggestedFrom && (
                <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  อ้างอิงจากร่างหนังสือ: <span className="italic">"{aiSuggestedFrom}"</span>
                </div>
              )}
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5">
                💡 ตรวจสอบและแก้ไขได้หากไม่เหมาะสม — กดเลือก/ยกเลิกหน่วยในผังด้านล่าง
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cascade toggle */}
      <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          วิธีการกระจายคำสั่ง
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CascadeOption
            selected={cascadeMode === "CASCADE"}
            onClick={() => onChange(selectedIds, "CASCADE")}
            title="ลงตามลำดับชั้น (Cascade)"
            desc="ส่งให้หน่วยที่เลือก + ลูกหลานทั้งหมด KPI ตกถึงสถานี"
          />
          <CascadeOption
            selected={cascadeMode === "DIRECT"}
            onClick={() => onChange(selectedIds, "DIRECT")}
            title="ส่งตรง (Direct)"
            desc="ส่งให้เฉพาะหน่วยที่เลือกเท่านั้น"
          />
        </div>
      </div>

      {/* Search + actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาหน่วยงาน..."
            className="w-full rounded-sm border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={expandAll}
          className="text-xs text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-300 rounded-sm hover:bg-slate-50"
        >
          ขยายทั้งหมด
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={collapseAll}
          className="text-xs text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-300 rounded-sm hover:bg-slate-50"
        >
          ยุบทั้งหมด
        </button>
      </div>

      {/* Tree */}
      <div className="rounded-sm border border-slate-200 bg-white max-h-[500px] overflow-y-auto p-2">
        <TreeNode
          node={data.tree}
          depth={0}
          commandableSet={commandableSet}
          selectedSet={selectedSet}
          expanded={expanded}
          search={search}
          matchesSearch={matchesSearch}
          onToggleExpand={toggleExpand}
          onToggleSelect={toggleSelect}
        />
      </div>

      {/* Selection summary — shows effective impact */}
      <div className="rounded-sm border-2 border-emerald-400 bg-emerald-50 p-4">
        {selectedIds.length === 0 ? (
          <div className="text-sm text-emerald-700 text-center py-2">
            ยังไม่ได้เลือกหน่วย — คลิก ☐ ในแถวเพื่อเลือก
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                  หน่วยที่เลือกตรง
                </div>
                <div className="text-3xl font-bold text-emerald-900 leading-none">
                  {selectedIds.length}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">หน่วย</div>
              </div>
              <div className="text-2xl text-emerald-400">→</div>
              <div className="flex-1 text-right">
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                  ส่งผลถึงทั้งหมด
                </div>
                <div className="text-3xl font-bold text-emerald-900 leading-none">
                  {effectiveCount}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  หน่วย
                  {cascadeMode === "CASCADE" && effectiveCount > selectedIds.length && (
                    <span className="ml-1">(รวมหน่วยลูก +{effectiveCount - selectedIds.length})</span>
                  )}
                </div>
              </div>
            </div>
            {cascadeMode === "CASCADE" && (
              <div className="flex gap-3 text-[11px] text-emerald-800 pt-2 border-t border-emerald-200">
                <span>🏛️ บช. {effectiveBreakdown.bureaus}</span>
                <span>📋 บก./ภ.จว. {effectiveBreakdown.divisions}</span>
                <span>🏢 สน./สภ. {effectiveBreakdown.stations}</span>
              </div>
            )}
            <div className="text-[11px] text-emerald-700 leading-relaxed pt-1 border-t border-emerald-200">
              {cascadeMode === "CASCADE"
                ? "💡 KPI จะถูก auto-distribute ให้สถานีปลายทางทั้งหมด"
                : "💡 ส่งให้หน่วยที่เลือกตรงเท่านั้น — ไม่ถึงหน่วยลูก"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CascadeOptionProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}

function CascadeOption({ selected, onClick, title, desc }: CascadeOptionProps) {
  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      className={`text-left rounded-sm border-2 p-3 transition-colors ${
        selected
          ? "border-[#1e3a5f] bg-white"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-[#1e3a5f] bg-[#1e3a5f]" : "border-slate-300"
        }`}>
          {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </div>
      <div className="text-[11px] text-slate-600 leading-snug">{desc}</div>
    </button>
  );
}

interface TreeNodeProps {
  node: OrgTreeNode;
  depth: number;
  commandableSet: Set<string>;
  selectedSet: Set<string>;
  expanded: Set<string>;
  search: string;
  matchesSearch: (u: OrgUnit) => boolean;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

function TreeNode({
  node,
  depth,
  commandableSet,
  selectedSet,
  expanded,
  search,
  matchesSearch,
  onToggleExpand,
  onToggleSelect,
}: TreeNodeProps) {
  const isExpanded = expanded.has(node.id);
  const isCommandable = commandableSet.has(node.id);
  const isSelected = selectedSet.has(node.id);
  const hasChildren = node.children.length > 0;

  // Filter via search: keep this node if it matches OR any descendant matches
  const selfMatches = matchesSearch(node);
  const descendantMatches = (n: OrgTreeNode): boolean => {
    if (matchesSearch(n)) return true;
    return n.children.some(descendantMatches);
  };
  const anyMatch = selfMatches || (search && node.children.some(descendantMatches));
  if (search && !anyMatch) return null;

  // Auto-expand on search match
  const showChildren = isExpanded || (search && node.children.some(descendantMatches));

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 18}px` }}
        className={`group flex items-center gap-1 py-1 px-1 rounded-sm ${
          isCommandable ? "hover:bg-slate-50" : "opacity-50"
        }`}
      >
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onToggleExpand(node.id)}
          disabled={!hasChildren}
          className="shrink-0 p-0.5 hover:bg-slate-200 rounded"
          aria-label="Toggle"
        >
          {hasChildren ? (
            showChildren ? (
              <ChevronDown className="h-3 w-3 text-slate-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-500" />
            )
          ) : (
            <span className="block h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onToggleSelect(node.id)}
          disabled={!isCommandable}
          className={`shrink-0 h-4 w-4 rounded-sm border-2 flex items-center justify-center ${
            isSelected
              ? "border-emerald-600 bg-emerald-600"
              : isCommandable
              ? "border-slate-300 hover:border-slate-500"
              : "border-slate-200 bg-slate-100"
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
        </button>
        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => onToggleSelect(node.id)}
          disabled={!isCommandable}
          className={`flex-1 text-left text-sm ${
            isCommandable ? "text-slate-800 hover:text-slate-900" : "text-slate-400 cursor-not-allowed"
          }`}
        >
          <span className="font-medium">{node.shortName ?? node.code}</span>
          {node.shortName && node.shortName !== node.code && (
            <span className="text-[10px] text-slate-400 ml-1.5">{node.code}</span>
          )}
          {node.region && depth <= 1 && (
            <span className="text-[10px] text-slate-400 ml-2">({node.region})</span>
          )}
        </button>
      </div>
      {showChildren && hasChildren && (
        <div>
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              commandableSet={commandableSet}
              selectedSet={selectedSet}
              expanded={expanded}
              search={search}
              matchesSearch={matchesSearch}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
