// Demo mode — no real authentication.
// Current "user" comes from the active persona in police-org store.
// When persona switcher changes it, lib/auth here reflects the change.

import { getActivePersona, getUnit } from "@/lib/police-org/store";

export type DemoRole = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  rank: string;
  unitCode: string;
  unitId: string | null;
}

/** Legacy constant kept for backward compat — prefer getCurrentUser() */
export const DEMO_USER: DemoUser = buildUser();

function buildUser(): DemoUser {
  const persona = getActivePersona();
  const unit = getUnit(persona.unitId);
  return {
    id: persona.id,
    name: persona.name,
    email: `${persona.id}@eop.local`,
    role: "ADMIN", // ทุก persona เป็น admin ใน demo (เพราะถอด RBAC ออก)
    rank: persona.rank,
    unitCode: unit?.shortName ?? unit?.code ?? "—",
    unitId: persona.unitId,
  };
}

export interface DemoSession {
  user: DemoUser;
}

export async function auth(): Promise<DemoSession> {
  return { user: buildUser() };
}
