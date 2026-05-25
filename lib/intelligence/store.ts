// In-memory store for ระบบบริหารจัดการข้อมูลและปัญญาประดิษฐ์ (System 6)

import type {
  IntelDocument,
  Incident,
  PredictiveTrend,
  ExecutiveSummary,
  DocCategory,
  IncidentType,
  IncidentSeverity,
} from "./types";
import { SEED_DOCUMENTS } from "./seed-documents";
import { SEED_INCIDENTS } from "./seed-incidents";
import { SEED_TRENDS } from "./seed-predictive";
import { SEED_SUMMARIES } from "./seed-summaries";

interface IntelStore {
  documents: Map<string, IntelDocument>;
  incidents: Map<string, Incident>;
  trends: Map<string, PredictiveTrend>;
  summaries: Map<string, ExecutiveSummary>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __intelStore: IntelStore | undefined;
}

function getStore(): IntelStore {
  if (!globalThis.__intelStore) {
    globalThis.__intelStore = {
      documents: new Map(),
      incidents: new Map(),
      trends: new Map(),
      summaries: new Map(),
      seeded: false,
    };
  }
  const store = globalThis.__intelStore;
  if (!store.seeded) {
    store.seeded = true;
    for (const d of SEED_DOCUMENTS) store.documents.set(d.id, d);
    for (const i of SEED_INCIDENTS) store.incidents.set(i.id, i);
    for (const t of SEED_TRENDS) store.trends.set(t.id, t);
    for (const s of SEED_SUMMARIES) store.summaries.set(s.id, s);
  }
  return store;
}

// ── Documents ───────────────────────────────────

export function listDocuments(filter?: {
  category?: DocCategory;
  fromUnitId?: string;
}): IntelDocument[] {
  const all = Array.from(getStore().documents.values());
  let filtered = all;
  if (filter?.category) {
    filtered = filtered.filter((d) => d.category === filter.category);
  }
  if (filter?.fromUnitId) {
    filtered = filtered.filter((d) => d.fromUnitId === filter.fromUnitId);
  }
  return filtered.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getDocument(id: string): IntelDocument | null {
  return getStore().documents.get(id) ?? null;
}

export function addDocument(doc: IntelDocument): IntelDocument {
  getStore().documents.set(doc.id, doc);
  return doc;
}

export function countDocsByCategory(): Record<DocCategory, number> {
  const counts: Record<string, number> = {};
  for (const d of getStore().documents.values()) {
    counts[d.category] = (counts[d.category] ?? 0) + 1;
  }
  return counts as Record<DocCategory, number>;
}

// ── Incidents ───────────────────────────────────

export function listIncidents(filter?: {
  type?: IncidentType;
  severity?: IncidentSeverity;
  province?: string;
  daysWithin?: number;
}): Incident[] {
  const all = Array.from(getStore().incidents.values());
  let filtered = all;
  if (filter?.type) filtered = filtered.filter((i) => i.type === filter.type);
  if (filter?.severity)
    filtered = filtered.filter((i) => i.severity === filter.severity);
  if (filter?.province)
    filtered = filtered.filter((i) => i.location.province === filter.province);
  if (filter?.daysWithin) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.daysWithin);
    filtered = filtered.filter((i) => new Date(i.occurredAt) >= cutoff);
  }
  return filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function getIncident(id: string): Incident | null {
  return getStore().incidents.get(id) ?? null;
}

export function addIncident(i: Incident): Incident {
  getStore().incidents.set(i.id, i);
  return i;
}

export function countIncidentsByProvince(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const i of getStore().incidents.values()) {
    counts[i.location.province] = (counts[i.location.province] ?? 0) + 1;
  }
  return counts;
}

export function countIncidentsByType(): Record<IncidentType, number> {
  const counts: Record<string, number> = {};
  for (const i of getStore().incidents.values()) {
    counts[i.type] = (counts[i.type] ?? 0) + 1;
  }
  return counts as Record<IncidentType, number>;
}

// ── Trends ──────────────────────────────────────

export function listTrends(): PredictiveTrend[] {
  return Array.from(getStore().trends.values());
}

export function getTrend(id: string): PredictiveTrend | null {
  return getStore().trends.get(id) ?? null;
}

// ── Summaries ───────────────────────────────────

export function listSummaries(): ExecutiveSummary[] {
  return Array.from(getStore().summaries.values()).sort((a, b) =>
    b.generatedAt.localeCompare(a.generatedAt)
  );
}

export function getSummary(id: string): ExecutiveSummary | null {
  return getStore().summaries.get(id) ?? null;
}

export function addSummary(s: ExecutiveSummary): ExecutiveSummary {
  getStore().summaries.set(s.id, s);
  return s;
}

// ── ID generators ───────────────────────────────

export function genDocId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function genSummaryId(): string {
  return `sum-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Aggregate stats ─────────────────────────────

export function getIntelStats() {
  const store = getStore();
  const incidentsLast30 = listIncidents({ daysWithin: 30 }).length;
  return {
    totalDocuments: store.documents.size,
    incidentsLast30,
    totalTrends: store.trends.size,
    totalSummaries: store.summaries.size,
  };
}
