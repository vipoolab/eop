// In-memory store for คลังแผนยุทธศาสตร์
//
// In Next.js dev mode, a module-level Map persists across requests within the
// same Node worker. In production this would be per-worker — for the demo
// that's acceptable; the seed re-runs on boot so the data is always there.

import type {
  PlanDocument,
  PlanItem,
  PlanLevel,
  PlanTreeNode,
  PlanSummaryStats,
} from "./types";
import {
  NATIONAL_STRATEGY_DOC,
  NATIONAL_STRATEGY_ITEMS,
} from "./seed-level1";
import { MASTER_PLANS, MASTER_PLAN_ITEMS } from "./seed-level2";
import { ACTION_PLANS, ACTION_PLAN_ITEMS } from "./seed-level3";

interface Store {
  documents: Map<string, PlanDocument>;
  items: Map<string, PlanItem>;
}

declare global {
  // eslint-disable-next-line no-var
  var __strategicStore: Store | undefined;
}

function createStore(): Store {
  const store: Store = {
    documents: new Map(),
    items: new Map(),
  };
  seedStore(store);
  return store;
}

function seedStore(store: Store) {
  // Level 1
  store.documents.set(NATIONAL_STRATEGY_DOC.id, NATIONAL_STRATEGY_DOC);
  for (const it of NATIONAL_STRATEGY_ITEMS) store.items.set(it.id, it);

  // Level 2
  for (const doc of MASTER_PLANS) store.documents.set(doc.id, doc);
  for (const it of MASTER_PLAN_ITEMS) store.items.set(it.id, it);

  // Level 3
  for (const doc of ACTION_PLANS) store.documents.set(doc.id, doc);
  for (const it of ACTION_PLAN_ITEMS) store.items.set(it.id, it);
}

function getStore(): Store {
  if (!globalThis.__strategicStore) {
    globalThis.__strategicStore = createStore();
  }
  return globalThis.__strategicStore;
}

// ─────────────────────────────────────────────
// Read operations
// ─────────────────────────────────────────────

export function listDocuments(level?: PlanLevel): PlanDocument[] {
  const docs = Array.from(getStore().documents.values());
  const filtered = level ? docs.filter((d) => d.level === level) : docs;
  return filtered.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.uploadedAt.localeCompare(b.uploadedAt);
  });
}

export function getDocument(id: string): PlanDocument | null {
  return getStore().documents.get(id) ?? null;
}

export function getNationalStrategy(): PlanDocument | null {
  return listDocuments(1)[0] ?? null;
}

export function getItemsForDocument(documentId: string): PlanItem[] {
  return Array.from(getStore().items.values())
    .filter((i) => i.documentId === documentId)
    .sort((a, b) => a.order - b.order || a.number.localeCompare(b.number, "th"));
}

export function getChildDocuments(parentDocId: string): PlanDocument[] {
  return Array.from(getStore().documents.values())
    .filter((d) => d.parentDocId === parentDocId)
    .sort((a, b) => a.title.localeCompare(b.title, "th"));
}

// Build a tree of items with .children populated
export function buildItemTree(items: PlanItem[]): PlanItem[] {
  const byId = new Map<string, PlanItem>();
  const roots: PlanItem[] = [];

  for (const it of items) {
    byId.set(it.id, { ...it, children: [] });
  }

  for (const it of byId.values()) {
    if (it.parentItemId) {
      const parent = byId.get(it.parentItemId);
      if (parent) {
        parent.children ??= [];
        parent.children.push(it);
      } else {
        roots.push(it); // orphan — promote to root
      }
    } else {
      roots.push(it);
    }
  }

  // Sort children by number/order
  function sortRec(nodes: PlanItem[]) {
    nodes.sort((a, b) => a.order - b.order || a.number.localeCompare(b.number, "th"));
    for (const n of nodes) if (n.children?.length) sortRec(n.children);
  }
  sortRec(roots);

  return roots;
}

// Build full tree starting from the national strategy
export function buildDocTree(): PlanTreeNode | null {
  const root = getNationalStrategy();
  if (!root) return null;
  return buildDocSubtree(root);
}

function buildDocSubtree(doc: PlanDocument): PlanTreeNode {
  const items = getItemsForDocument(doc.id);
  const itemTree = buildItemTree(items);
  const childDocs = getChildDocuments(doc.id).map(buildDocSubtree);
  const totalItemCount = countAllItems(itemTree) + childDocs.reduce((s, c) => s + c.totalItemCount, 0);

  return {
    ...doc,
    items: itemTree,
    childDocs,
    itemCount: items.length,
    totalItemCount,
  };
}

function countAllItems(items: PlanItem[]): number {
  let count = items.length;
  for (const i of items) if (i.children?.length) count += countAllItems(i.children);
  return count;
}

export function getStats(): PlanSummaryStats {
  const docs = Array.from(getStore().documents.values());
  const items = Array.from(getStore().items.values());
  const lastUpdated = docs
    .map((d) => d.parsedAt ?? d.uploadedAt)
    .sort()
    .reverse()[0];
  return {
    level1Count: docs.filter((d) => d.level === 1).length,
    level2Count: docs.filter((d) => d.level === 2).length,
    level3Count: docs.filter((d) => d.level === 3).length,
    totalItems: items.length,
    lastUpdatedAt: lastUpdated ?? null,
  };
}

// ─────────────────────────────────────────────
// Write operations
// ─────────────────────────────────────────────

export function addDocument(doc: PlanDocument): PlanDocument {
  getStore().documents.set(doc.id, doc);
  return doc;
}

export function updateDocument(id: string, patch: Partial<PlanDocument>): PlanDocument | null {
  const doc = getStore().documents.get(id);
  if (!doc) return null;
  const updated = { ...doc, ...patch };
  getStore().documents.set(id, updated);
  return updated;
}

export function deleteDocument(id: string): boolean {
  const store = getStore();
  const doc = store.documents.get(id);
  if (!doc) return false;

  // Delete all items belonging to this document
  for (const [itemId, item] of store.items) {
    if (item.documentId === id) store.items.delete(itemId);
  }
  // Detach child docs
  for (const [childId, child] of store.documents) {
    if (child.parentDocId === id) {
      store.documents.set(childId, { ...child, parentDocId: null });
    }
  }
  store.documents.delete(id);
  return true;
}

export function addItems(items: PlanItem[]) {
  const store = getStore();
  for (const it of items) store.items.set(it.id, it);
}

export function deleteItemsForDocument(documentId: string) {
  const store = getStore();
  for (const [id, it] of store.items) {
    if (it.documentId === documentId) store.items.delete(id);
  }
}

export function resetToSeed() {
  globalThis.__strategicStore = createStore();
}
