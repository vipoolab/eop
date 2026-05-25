// In-memory store for Assessments (ระบบวางแผนและติดตามกฎระเบียบ)

import type { Assessment, AssessmentStatus, AssessmentSubmission } from "./types";
import { SEED_ASSESSMENTS } from "./seed";

interface AssessmentStore {
  assessments: Map<string, Assessment>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __assessmentStore: AssessmentStore | undefined;
}

function getStore(): AssessmentStore {
  if (!globalThis.__assessmentStore) {
    globalThis.__assessmentStore = { assessments: new Map(), seeded: false };
  }
  const store = globalThis.__assessmentStore;
  if (!store.seeded) {
    store.seeded = true;
    for (const a of SEED_ASSESSMENTS) {
      if (!store.assessments.has(a.id)) {
        store.assessments.set(a.id, a);
      }
    }
  }
  return store;
}

// ── Read ──────────────────────────────────────

export function listAssessments(filter?: {
  status?: AssessmentStatus;
  createdBy?: string;
}): Assessment[] {
  const all = Array.from(getStore().assessments.values());
  let filtered = all;
  if (filter?.status) {
    filtered = filtered.filter((a) => a.status === filter.status);
  }
  if (filter?.createdBy) {
    filtered = filtered.filter((a) => a.createdBy === filter.createdBy);
  }
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAssessment(id: string): Assessment | null {
  return getStore().assessments.get(id) ?? null;
}

// ── Write ─────────────────────────────────────

export function addAssessment(a: Assessment): Assessment {
  getStore().assessments.set(a.id, a);
  return a;
}

export function updateAssessment(
  id: string,
  patch: Partial<Assessment>
): Assessment | null {
  const a = getStore().assessments.get(id);
  if (!a) return null;
  const updated: Assessment = { ...a, ...patch };
  getStore().assessments.set(id, updated);
  return updated;
}

export function addSubmission(
  assessmentId: string,
  sub: AssessmentSubmission
): Assessment | null {
  const a = getStore().assessments.get(assessmentId);
  if (!a) return null;
  const updated: Assessment = {
    ...a,
    submissions: [...a.submissions, sub],
  };
  getStore().assessments.set(assessmentId, updated);
  return updated;
}

export function updateSubmission(
  assessmentId: string,
  subId: string,
  patch: Partial<AssessmentSubmission>
): Assessment | null {
  const a = getStore().assessments.get(assessmentId);
  if (!a) return null;
  const submissions = a.submissions.map((s) =>
    s.id === subId ? { ...s, ...patch } : s
  );
  const updated: Assessment = { ...a, submissions };
  getStore().assessments.set(assessmentId, updated);
  return updated;
}

// ── ID generators ─────────────────────────────

export function genAssessmentId(): string {
  return `assess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function genSubmissionId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
