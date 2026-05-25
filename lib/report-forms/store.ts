// In-memory store for Report Forms (แบบฟอร์มรายงาน)

import type { ReportForm } from "./types";
import { SEED_FORMS } from "./seed";

interface FormStore {
  forms: Map<string, ReportForm>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __reportFormStore: FormStore | undefined;
}

function getStore(): FormStore {
  if (!globalThis.__reportFormStore) {
    globalThis.__reportFormStore = { forms: new Map(), seeded: false };
  }
  const store = globalThis.__reportFormStore;
  if (!store.seeded) {
    store.seeded = true;
    for (const form of SEED_FORMS) {
      if (!store.forms.has(form.id)) {
        store.forms.set(form.id, form);
      }
    }
  }
  return store;
}

// ── Read ──────────────────────────────────────

export function listForms(activeOnly = false): ReportForm[] {
  const all = Array.from(getStore().forms.values());
  const filtered = activeOnly ? all.filter((f) => f.isActive) : all;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getForm(id: string): ReportForm | null {
  return getStore().forms.get(id) ?? null;
}

// ── Write ─────────────────────────────────────

export function addForm(form: ReportForm): ReportForm {
  getStore().forms.set(form.id, form);
  return form;
}

export function updateForm(id: string, patch: Partial<ReportForm>): ReportForm | null {
  const f = getStore().forms.get(id);
  if (!f) return null;
  const updated: ReportForm = { ...f, ...patch, updatedAt: new Date().toISOString() };
  getStore().forms.set(id, updated);
  return updated;
}

export function deleteForm(id: string): boolean {
  return getStore().forms.delete(id);
}

// ── ID generator ──────────────────────────────

export function genFormId(): string {
  return `form-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function genFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
