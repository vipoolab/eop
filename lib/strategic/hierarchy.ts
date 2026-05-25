// Hierarchy helpers — map plan documents into a 4-level structure
//   NS (1) → Pillar (6 ด้าน) → MP (23) → AP (8)
//
// Pillars come from PlanItems of the NS document.
// MPs are linked to NS via parentDocId; we infer their pillar by matching
// the MP's metadata.agency against pillar names.

import type { PlanDocument, PlanItem } from "./types";

export interface PillarSummary {
  id: string; // PlanItem id of the pillar
  number: string;
  name: string;
  shortName: string; // for display
  description?: string;
}

export interface HierarchyData {
  ns: PlanDocument | null;
  pillars: PillarSummary[];
  mps: PlanDocument[];
  aps: PlanDocument[];
  mpPillarMap: Record<string, string | null>; // mpId → pillarId
  apMpMap: Record<string, string>; // apId → mpId
}

// Short-name mapping for pillars (to fit in narrow columns)
const PILLAR_SHORT_NAMES: Record<string, string> = {
  "ความมั่นคง": "ความมั่นคง",
  "การสร้างความสามารถในการแข่งขัน": "การแข่งขัน",
  "การพัฒนาและเสริมสร้างศักยภาพทรัพยากรมนุษย์": "ทรัพยากรมนุษย์",
  "การสร้างโอกาสและความเสมอภาคทางสังคม": "โอกาส & ความเสมอภาค",
  "การสร้างการเติบโตบนคุณภาพชีวิตที่เป็นมิตรต่อสิ่งแวดล้อม": "สิ่งแวดล้อม",
  "การปรับสมดุลและพัฒนาระบบการบริหารจัดการภาครัฐ": "ภาครัฐ",
};

function extractShortName(name: string): string {
  // Strip leading "ยุทธศาสตร์ชาติด้าน"
  const stripped = name.replace(/^ยุทธศาสตร์ชาติด้าน/, "");
  return PILLAR_SHORT_NAMES[stripped] ?? stripped;
}

export function buildHierarchy(
  allDocs: PlanDocument[],
  allItems: PlanItem[]
): HierarchyData {
  const ns = allDocs.find((d) => d.level === 1) ?? null;
  const mps = allDocs.filter((d) => d.level === 2);
  const aps = allDocs.filter((d) => d.level === 3);

  // Pillars = top-level items (parentItemId === null) of the NS doc
  const pillars: PillarSummary[] = ns
    ? allItems
        .filter((i) => i.documentId === ns.id && i.parentItemId === null)
        .sort((a, b) => a.order - b.order)
        .map((p) => ({
          id: p.id,
          number: p.number,
          name: p.name,
          shortName: extractShortName(p.name),
          description: p.description,
        }))
    : [];

  // Map MP → pillar by string match on metadata.agency
  const mpPillarMap: Record<string, string | null> = {};
  for (const mp of mps) {
    mpPillarMap[mp.id] = inferPillar(mp, pillars);
  }

  // Map AP → MP via parentDocId
  const apMpMap: Record<string, string> = {};
  for (const ap of aps) {
    if (ap.parentDocId) apMpMap[ap.id] = ap.parentDocId;
  }

  return { ns, pillars, mps, aps, mpPillarMap, apMpMap };
}

function inferPillar(mp: PlanDocument, pillars: PillarSummary[]): string | null {
  const agency = (mp.metadata?.agency ?? "").trim();
  if (!agency || agency === "ทุกด้าน") return null;

  // Match by keyword in pillar name
  const keywords: { keyword: string; matchPillar: (p: PillarSummary) => boolean }[] = [
    { keyword: "ความมั่นคง", matchPillar: (p) => p.name.includes("ความมั่นคง") },
    {
      keyword: "แข่งขัน",
      matchPillar: (p) => p.name.includes("แข่งขัน"),
    },
    {
      keyword: "ทรัพยากร",
      matchPillar: (p) => p.name.includes("ทรัพยากรมนุษย์"),
    },
    {
      keyword: "โอกาส",
      matchPillar: (p) => p.name.includes("โอกาสและความเสมอภาค"),
    },
    {
      keyword: "สิ่งแวดล้อม",
      matchPillar: (p) =>
        p.name.includes("สิ่งแวดล้อม") || p.name.includes("เติบโต"),
    },
    {
      keyword: "ภาครัฐ",
      matchPillar: (p) => p.name.includes("ภาครัฐ"),
    },
  ];

  for (const k of keywords) {
    if (agency.includes(k.keyword)) {
      const found = pillars.find(k.matchPillar);
      if (found) return found.id;
    }
  }
  return null;
}

// ── Coverage stats ─────────────────────────────────────

export interface HierarchyStats {
  mpsWithAp: number;
  mpsTotal: number;
  apCoveragePercent: number;
  pillarsWithMp: number;
  pillarsTotal: number;
  pillarCoveragePercent: number;
  topUnits: { name: string; count: number }[];
  topMpByItems: { id: string; title: string; itemCount: number }[];
}

export function computeStats(
  data: HierarchyData,
  allItems: PlanItem[]
): HierarchyStats {
  const { pillars, mps, aps, mpPillarMap, apMpMap } = data;

  // MPs that have at least one AP
  const mpsWithApIds = new Set(Object.values(apMpMap));
  const mpsWithAp = mps.filter((mp) => mpsWithApIds.has(mp.id)).length;
  const apCoveragePercent = mps.length ? Math.round((mpsWithAp / mps.length) * 100) : 0;

  // Pillars that have at least one MP
  const pillarsWithMpIds = new Set(
    Object.values(mpPillarMap).filter(Boolean) as string[]
  );
  const pillarsWithMp = pillarsWithMpIds.size;
  const pillarCoveragePercent = pillars.length
    ? Math.round((pillarsWithMp / pillars.length) * 100)
    : 0;

  // Top units (sourced from AP item meta.owner aggregate, since AP itself
  // doesn't have a direct owner field — fall back to AP agency metadata)
  const unitCount: Record<string, number> = {};
  for (const ap of aps) {
    const owner = ap.metadata?.agency ?? "ไม่ระบุ";
    unitCount[owner] = (unitCount[owner] ?? 0) + 1;
  }
  const topUnits = Object.entries(unitCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top MPs by item count
  const mpItemCounts = mps.map((mp) => ({
    id: mp.id,
    title: mp.title,
    itemCount: allItems.filter((i) => i.documentId === mp.id).length,
  }));
  const topMpByItems = mpItemCounts
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 5);

  return {
    mpsWithAp,
    mpsTotal: mps.length,
    apCoveragePercent,
    pillarsWithMp,
    pillarsTotal: pillars.length,
    pillarCoveragePercent,
    topUnits,
    topMpByItems,
  };
}
