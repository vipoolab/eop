"use client";

// Hierarchy Dashboard — 4-column interactive explorer
//   NS → ด้าน → MP → AP
//
// Click any node to highlight the related path; click empty area to clear.

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Library,
  Compass,
  BookOpen,
  ClipboardList,
  Sigma,
  ChevronRight,
  X,
  ExternalLink,
  Layers,
  CheckCircle2,
} from "lucide-react";
import type {
  HierarchyData,
  HierarchyStats,
  PillarSummary,
} from "@/lib/strategic/hierarchy";
import type { PlanDocument } from "@/lib/strategic/types";

interface Props {
  data: HierarchyData;
  stats: HierarchyStats;
  /** itemCount per document id (precomputed on the server) */
  itemCounts: Record<string, number>;
}

type Selection =
  | { type: "ns" }
  | { type: "pillar"; id: string }
  | { type: "mp"; id: string }
  | { type: "ap"; id: string }
  | null;

export function HierarchyDashboard({ data, stats, itemCounts }: Props) {
  const { ns, pillars, mps, aps, mpPillarMap, apMpMap } = data;
  const [selected, setSelected] = useState<Selection>(null);

  // Determine highlight sets given current selection
  const highlight = useMemo(() => {
    if (!selected) return null;
    const hl = {
      ns: false,
      pillarIds: new Set<string>(),
      mpIds: new Set<string>(),
      apIds: new Set<string>(),
    };

    if (selected.type === "ns") {
      hl.ns = true;
      for (const p of pillars) hl.pillarIds.add(p.id);
      for (const mp of mps) hl.mpIds.add(mp.id);
      for (const ap of aps) hl.apIds.add(ap.id);
    } else if (selected.type === "pillar") {
      hl.ns = true;
      hl.pillarIds.add(selected.id);
      // MPs under this pillar
      for (const mp of mps) {
        if (mpPillarMap[mp.id] === selected.id) {
          hl.mpIds.add(mp.id);
        }
      }
      // APs under those MPs
      for (const ap of aps) {
        const parent = apMpMap[ap.id];
        if (parent && hl.mpIds.has(parent)) hl.apIds.add(ap.id);
      }
    } else if (selected.type === "mp") {
      hl.ns = true;
      hl.mpIds.add(selected.id);
      const pillarId = mpPillarMap[selected.id];
      if (pillarId) hl.pillarIds.add(pillarId);
      // APs under this MP
      for (const ap of aps) {
        if (apMpMap[ap.id] === selected.id) hl.apIds.add(ap.id);
      }
    } else if (selected.type === "ap") {
      hl.ns = true;
      hl.apIds.add(selected.id);
      const mpId = apMpMap[selected.id];
      if (mpId) {
        hl.mpIds.add(mpId);
        const pillarId = mpPillarMap[mpId];
        if (pillarId) hl.pillarIds.add(pillarId);
      }
    }
    return hl;
  }, [selected, pillars, mps, aps, mpPillarMap, apMpMap]);

  // Show the breadcrumb path of current selection
  const breadcrumb = useMemo(() => {
    if (!selected) return null;
    if (!ns) return null;
    const parts: { label: string; sub?: string }[] = [];
    parts.push({ label: "ยุทธศาสตร์ชาติ", sub: ns.title });

    if (selected.type === "pillar") {
      const p = pillars.find((pp) => pp.id === selected.id);
      if (p) parts.push({ label: `ด้าน ${p.number}`, sub: p.shortName });
    } else if (selected.type === "mp") {
      const pillarId = mpPillarMap[selected.id];
      const p = pillarId ? pillars.find((pp) => pp.id === pillarId) : null;
      if (p) parts.push({ label: `ด้าน ${p.number}`, sub: p.shortName });
      const mp = mps.find((m) => m.id === selected.id);
      if (mp) parts.push({ label: "แผนแม่บท", sub: mp.title });
    } else if (selected.type === "ap") {
      const mpId = apMpMap[selected.id];
      const mp = mpId ? mps.find((m) => m.id === mpId) : null;
      if (mp) {
        const pillarId = mpPillarMap[mp.id];
        const p = pillarId ? pillars.find((pp) => pp.id === pillarId) : null;
        if (p) parts.push({ label: `ด้าน ${p.number}`, sub: p.shortName });
        parts.push({ label: "แผนแม่บท", sub: mp.title });
      }
      const ap = aps.find((a) => a.id === selected.id);
      if (ap) parts.push({ label: "แผนปฏิบัติ", sub: ap.title });
    }
    return parts;
  }, [selected, ns, pillars, mps, aps, mpPillarMap, apMpMap]);

  function isHighlighted(type: "ns" | "pillar" | "mp" | "ap", id?: string): boolean {
    if (!highlight) return true; // no selection → everything full
    if (type === "ns") return highlight.ns;
    if (type === "pillar") return highlight.pillarIds.has(id!);
    if (type === "mp") return highlight.mpIds.has(id!);
    return highlight.apIds.has(id!);
  }

  function isSelected(type: "ns" | "pillar" | "mp" | "ap", id?: string): boolean {
    if (!selected) return false;
    if (selected.type === "ns") return type === "ns";
    if (selected.type === "pillar")
      return type === "pillar" && selected.id === id;
    if (selected.type === "mp") return type === "mp" && selected.id === id;
    return type === "ap" && selected.id === id;
  }

  if (!ns) {
    return (
      <div className="rounded-sm border border-slate-200 bg-white p-12 text-center">
        <Library className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <div className="text-sm text-slate-500">ยังไม่มียุทธศาสตร์ชาติในระบบ</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb / instruction bar */}
      <div className="flex items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm min-w-0">
          {breadcrumb ? (
            <>
              <span className="text-xs text-slate-500 shrink-0">เส้นทางที่เลือก:</span>
              {breadcrumb.map((b, idx) => (
                <span key={idx} className="flex items-center gap-2 min-w-0">
                  {idx > 0 && (
                    <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs">
                    <span className="text-slate-500">{b.label}</span>
                    {b.sub && (
                      <span className="ml-1 font-medium text-slate-800 truncate">
                        {b.sub.length > 40 ? b.sub.slice(0, 40) + "..." : b.sub}
                      </span>
                    )}
                  </span>
                </span>
              ))}
            </>
          ) : (
            <span className="text-xs text-slate-500">
              💡 คลิก ด้าน / แผนแม่บท / แผนปฏิบัติ เพื่อดูความสัมพันธ์
            </span>
          )}
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            suppressHydrationWarning
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-100 rounded-sm shrink-0"
          >
            <X className="h-3 w-3" />
            ยกเลิก
          </button>
        )}
      </div>

      {/* 4-column hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Column 1: NS (2 cols) */}
        <Column
          icon={Library}
          title="ยุทธศาสตร์ชาติ"
          subtitle="ระดับ ๑"
          count={1}
          gridSpan="md:col-span-3"
          accent="navy"
        >
          <NSCard
            ns={ns}
            pillars={pillars}
            selected={isSelected("ns")}
            highlighted={isHighlighted("ns")}
            onClick={() => setSelected({ type: "ns" })}
            itemCount={itemCounts[ns.id] ?? 0}
          />
        </Column>

        {/* Column 2: Pillars (3 cols) */}
        <Column
          icon={Compass}
          title="ด้านยุทธศาสตร์"
          subtitle="ประเด็นย่อย"
          count={pillars.length}
          gridSpan="md:col-span-3"
          accent="navy"
        >
          {pillars.map((p) => (
            <PillarCard
              key={p.id}
              pillar={p}
              selected={isSelected("pillar", p.id)}
              highlighted={isHighlighted("pillar", p.id)}
              mpCount={mps.filter((mp) => mpPillarMap[mp.id] === p.id).length}
              onClick={() => setSelected({ type: "pillar", id: p.id })}
            />
          ))}
        </Column>

        {/* Column 3: MPs (3 cols) */}
        <Column
          icon={BookOpen}
          title="แผนแม่บท"
          subtitle="ระดับ ๒"
          count={mps.length}
          gridSpan="md:col-span-3"
          accent="gold"
        >
          {mps.map((mp) => (
            <MPCard
              key={mp.id}
              mp={mp}
              selected={isSelected("mp", mp.id)}
              highlighted={isHighlighted("mp", mp.id)}
              apCount={aps.filter((ap) => apMpMap[ap.id] === mp.id).length}
              onClick={() => setSelected({ type: "mp", id: mp.id })}
            />
          ))}
        </Column>

        {/* Column 4: APs (3 cols) */}
        <Column
          icon={ClipboardList}
          title="แผนปฏิบัติราชการ"
          subtitle="ระดับ ๓"
          count={aps.length}
          gridSpan="md:col-span-3"
          accent="slate"
        >
          {aps.length > 0 ? (
            aps.map((ap) => (
              <APCard
                key={ap.id}
                ap={ap}
                selected={isSelected("ap", ap.id)}
                highlighted={isHighlighted("ap", ap.id)}
                onClick={() => setSelected({ type: "ap", id: ap.id })}
              />
            ))
          ) : (
            <div className="text-xs text-slate-400 text-center py-4">
              ยังไม่มีแผนปฏิบัติราชการ
            </div>
          )}
        </Column>
      </div>

      {/* Coverage stats */}
      <CoverageStats stats={stats} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Column wrapper
// ─────────────────────────────────────────────

function Column({
  icon: Icon,
  title,
  subtitle,
  count,
  gridSpan,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  count: number;
  gridSpan: string;
  accent: "navy" | "gold" | "slate";
  children: React.ReactNode;
}) {
  const headerColor = {
    navy: "bg-[#1e3a5f] text-white",
    gold: "bg-[#b8860b] text-white",
    slate: "bg-slate-700 text-white",
  }[accent];

  return (
    <div className={`${gridSpan} flex flex-col rounded-sm border border-slate-200 bg-white overflow-hidden`}>
      <div className={`flex items-center gap-2 px-3 py-2.5 ${headerColor}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 leading-none">
            {subtitle}
          </div>
          <div className="text-sm font-semibold leading-tight">{title}</div>
        </div>
        <div className="text-xl font-bold leading-none tabular-nums">{count}</div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card components
// ─────────────────────────────────────────────

function cardClasses(selected: boolean, highlighted: boolean, accent: string) {
  if (selected)
    return `${accent} ring-2 ring-[#1e3a5f] ring-offset-1 shadow-sm`;
  if (!highlighted) return "border-slate-100 bg-slate-50 opacity-40";
  return "border-slate-200 bg-white hover:bg-slate-50";
}

function NSCard({
  ns,
  pillars,
  selected,
  highlighted,
  onClick,
  itemCount,
}: {
  ns: PlanDocument;
  pillars: PillarSummary[];
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
  itemCount: number;
}) {
  return (
    <button
      onClick={onClick}
      suppressHydrationWarning
      className={`w-full text-left rounded-sm border p-3 transition-all ${cardClasses(
        selected,
        highlighted,
        "border-[#1e3a5f]/30 bg-gradient-to-br from-[#1e3a5f]/[0.04] to-white"
      )}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[#b8860b] mb-1">
        แผนระดับชาติ
      </div>
      <div className="font-semibold text-sm text-slate-900 leading-snug">
        {ns.title}
      </div>
      {ns.metadata?.startYear && ns.metadata.endYear && (
        <div className="text-xs text-slate-500 mt-1">
          พ.ศ. {ns.metadata.startYear} - {ns.metadata.endYear}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-sm bg-slate-50 border border-slate-200 p-1.5">
          <div className="text-lg font-bold text-[#1e3a5f] leading-none">
            {pillars.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">ด้าน</div>
        </div>
        <div className="rounded-sm bg-slate-50 border border-slate-200 p-1.5">
          <div className="text-lg font-bold text-[#1e3a5f] leading-none">
            {itemCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">ข้อทั้งหมด</div>
        </div>
      </div>
      <Link
        href={`/strategic/document/${ns.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1e3a5f] hover:underline"
      >
        ดูเอกสาร <ExternalLink className="h-2.5 w-2.5" />
      </Link>
    </button>
  );
}

function PillarCard({
  pillar,
  selected,
  highlighted,
  mpCount,
  onClick,
}: {
  pillar: PillarSummary;
  selected: boolean;
  highlighted: boolean;
  mpCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      suppressHydrationWarning
      className={`w-full text-left rounded-sm border p-2.5 transition-all ${cardClasses(
        selected,
        highlighted,
        "border-[#1e3a5f]/30 bg-[#1e3a5f]/[0.04]"
      )}`}
    >
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 shrink-0 rounded-sm bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center tabular-nums">
          {pillar.number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 leading-tight">
            {pillar.shortName}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <BookOpen className="h-2.5 w-2.5" />
            {mpCount} แผนแม่บท
          </div>
        </div>
      </div>
    </button>
  );
}

function MPCard({
  mp,
  selected,
  highlighted,
  apCount,
  onClick,
}: {
  mp: PlanDocument;
  selected: boolean;
  highlighted: boolean;
  apCount: number;
  onClick: () => void;
}) {
  // Extract "(XX) ประเด็น Y" → just "MP-XX" + name
  const mpNumber = mp.title.match(/\((\d+)\)/)?.[1] ?? "";
  const mpName =
    mp.title.split("ประเด็น").pop()?.trim() ??
    mp.title;

  return (
    <button
      onClick={onClick}
      suppressHydrationWarning
      className={`w-full text-left rounded-sm border p-2.5 transition-all ${cardClasses(
        selected,
        highlighted,
        "border-[#b8860b]/40 bg-[#b8860b]/[0.04]"
      )}`}
    >
      <div className="flex items-start gap-2">
        <div className="text-[10px] font-mono font-bold text-[#b8860b] bg-[#b8860b]/10 px-1.5 py-0.5 rounded shrink-0">
          MP-{mpNumber}
        </div>
        {apCount > 0 ? (
          <span
            className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm shrink-0 inline-flex items-center gap-0.5"
            title="มีแผนปฏิบัติ"
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            {apCount}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 shrink-0">—</span>
        )}
      </div>
      <div className="text-xs font-medium text-slate-800 leading-snug mt-1.5 line-clamp-2">
        {mpName}
      </div>
    </button>
  );
}

function APCard({
  ap,
  selected,
  highlighted,
  onClick,
}: {
  ap: PlanDocument;
  selected: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      suppressHydrationWarning
      className={`w-full text-left rounded-sm border p-2.5 transition-all ${cardClasses(
        selected,
        highlighted,
        "border-slate-400 bg-slate-50"
      )}`}
    >
      <div className="text-xs font-semibold text-slate-900 leading-snug line-clamp-3">
        {ap.title}
      </div>
      {ap.metadata?.fiscalYear && (
        <div className="text-[10px] text-slate-500 mt-1">
          พ.ศ. {ap.metadata.fiscalYear}
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Coverage stats
// ─────────────────────────────────────────────

function CoverageStats({ stats }: { stats: HierarchyStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Coverage donuts */}
      <StatCard
        icon={Layers}
        title="ด้านที่มีแผนแม่บท"
        accent="navy"
      >
        <CoverageBar
          current={stats.pillarsWithMp}
          total={stats.pillarsTotal}
          unit="ด้าน"
          percent={stats.pillarCoveragePercent}
          accent="navy"
        />
      </StatCard>

      <StatCard
        icon={BookOpen}
        title="แผนแม่บทที่มีแผนปฏิบัติ"
        accent="gold"
      >
        <CoverageBar
          current={stats.mpsWithAp}
          total={stats.mpsTotal}
          unit="ฉบับ"
          percent={stats.apCoveragePercent}
          accent="gold"
        />
      </StatCard>

      <StatCard
        icon={Sigma}
        title="แผนแม่บทที่มี items มากสุด"
        accent="slate"
      >
        <div className="space-y-1">
          {stats.topMpByItems.slice(0, 3).map((m) => {
            const num = m.title.match(/\((\d+)\)/)?.[1] ?? "";
            const name = m.title.split("ประเด็น").pop()?.trim() ?? m.title;
            return (
              <Link
                key={m.id}
                href={`/strategic/document/${m.id}`}
                className="flex items-center justify-between text-xs hover:bg-slate-50 rounded px-1.5 py-1"
              >
                <span className="min-w-0 truncate flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#b8860b]">
                    MP-{num}
                  </span>
                  <span className="text-slate-700 truncate">{name}</span>
                </span>
                <span className="text-slate-500 font-semibold tabular-nums ml-2">
                  {m.itemCount}
                </span>
              </Link>
            );
          })}
        </div>
      </StatCard>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: "navy" | "gold" | "slate";
  children: React.ReactNode;
}) {
  const accentBorder = {
    navy: "border-[#1e3a5f]/15",
    gold: "border-[#b8860b]/25",
    slate: "border-slate-300",
  }[accent];
  return (
    <div className={`rounded-sm border bg-white p-4 ${accentBorder}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function CoverageBar({
  current,
  total,
  unit,
  percent,
  accent,
}: {
  current: number;
  total: number;
  unit: string;
  percent: number;
  accent: "navy" | "gold";
}) {
  const barColor = {
    navy: "bg-[#1e3a5f]",
    gold: "bg-[#b8860b]",
  }[accent];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-bold text-slate-900 leading-none">
          {current}/{total}
        </div>
        <div className="text-sm font-semibold text-slate-600">{percent}%</div>
      </div>
      <div className="h-2 rounded-sm bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-[11px] text-slate-500 mt-1.5">
        ครอบคลุม {current} จาก {total} {unit}
      </div>
    </div>
  );
}
