// Police org store + hierarchical helpers

import { ALL_UNITS } from "./mock-data";
import type { OrgUnit, Persona, PersonaRole } from "./types";

// ─── Read ──────────────────────────────────────

export function listUnits(): OrgUnit[] {
  return ALL_UNITS;
}

export function getUnit(id: string): OrgUnit | null {
  return ALL_UNITS.find((u) => u.id === id) ?? null;
}

export function getChildren(parentId: string | null): OrgUnit[] {
  return ALL_UNITS.filter((u) => u.parentId === parentId);
}

/** All descendants of a unit (recursive) — does NOT include the unit itself */
export function getDescendants(unitId: string): OrgUnit[] {
  const result: OrgUnit[] = [];
  const queue: string[] = [unitId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const child of getChildren(cur)) {
      result.push(child);
      queue.push(child.id);
    }
  }
  return result;
}

/** Ancestor chain from this unit up to root */
export function getAncestors(unitId: string): OrgUnit[] {
  const result: OrgUnit[] = [];
  let cur = getUnit(unitId);
  while (cur?.parentId) {
    const parent = getUnit(cur.parentId);
    if (!parent) break;
    result.push(parent);
    cur = parent;
  }
  return result;
}

/** Full subtree rooted at unitId (includes the root itself) */
export function getSubtree(unitId: string): OrgUnit[] {
  const root = getUnit(unitId);
  return root ? [root, ...getDescendants(unitId)] : [];
}

/** Can a persona at `userUnitId` issue commands to `targetUnitId`? */
export function isCommandable(targetUnitId: string, userUnitId: string): boolean {
  if (targetUnitId === userUnitId) return true;
  const descendants = getDescendants(userUnitId);
  return descendants.some((d) => d.id === targetUnitId);
}

/** Units a persona is allowed to command (self + descendants) */
export function getCommandableUnits(userUnitId: string): OrgUnit[] {
  return getSubtree(userUnitId);
}

// ─── Tree builder for UI ───────────────────────

export interface OrgTreeNode extends OrgUnit {
  children: OrgTreeNode[];
}

export function buildOrgTree(rootId?: string): OrgTreeNode | null {
  const root = rootId ? getUnit(rootId) : ALL_UNITS.find((u) => u.parentId === null);
  if (!root) return null;
  return buildSubtree(root);
}

function buildSubtree(u: OrgUnit): OrgTreeNode {
  return {
    ...u,
    children: getChildren(u.id).map(buildSubtree),
  };
}

// ─── Personas (for demo persona switcher) ──────

export const PERSONAS: Persona[] = [
  // ── Senior commanders (APPROVE authority) ──
  {
    id: "p-rtp",
    name: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    rank: "พล.ต.อ.",
    unitId: "u-rtp",
    role: "ผบ.ตร.",
    authority: "APPROVE",
    digitalSignature: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    description: "ผู้บัญชาการตำรวจแห่งชาติ — อนุมัติ + ส่งคำสั่งระดับชาติได้",
  },
  {
    id: "p-bch-na",
    name: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    rank: "พล.ต.ท.",
    unitId: "u-bch-na",
    role: "ผบช.",
    authority: "APPROVE",
    digitalSignature: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    description: "ผู้บัญชาการตำรวจนครบาล — บัญชาการ บก.น./สน. ใน กทม.",
  },
  {
    id: "p-bch-5",
    name: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์",
    rank: "พล.ต.ท.",
    unitId: "u-bch-5",
    role: "ผบช.",
    authority: "APPROVE",
    digitalSignature: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์",
    description: "ผู้บัญชาการตำรวจภูธรภาค ๕ — บัญชาการภาคเหนือตอนบน",
  },
  {
    id: "p-prov-cm",
    name: "พล.ต.ต. ภาคภูมิ ไชยหงษ์",
    rank: "พล.ต.ต.",
    unitId: "u-prov-5-ชม",
    role: "ผบก.",
    authority: "APPROVE",
    digitalSignature: "พล.ต.ต. ภาคภูมิ ไชยหงษ์",
    description: "ผู้บังคับการตำรวจภูธรจังหวัดเชียงใหม่",
  },

  // ── Drafters (DRAFT_ONLY — junior staff) ──
  {
    id: "p-aide-rtp",
    name: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
    rank: "พล.ต.ท.",
    unitId: "u-rtp",
    role: "รอง ผบ.ตร.",
    authority: "DRAFT_ONLY",
    supervisorPersonaId: "p-rtp",
    description:
      "รอง ผบ.ตร. — ร่างหนังสือสั่งการในนามของ ตร. เพื่อเสนอ ผบ.ตร. อนุมัติ",
  },
  {
    id: "p-aide-bch-5",
    name: "พล.ต.ต. ทรงพล ปัสนานนท์",
    rank: "พล.ต.ต.",
    unitId: "u-bch-5",
    role: "รอง ผบช.",
    authority: "DRAFT_ONLY",
    supervisorPersonaId: "p-bch-5",
    description: "รอง ผบช.ภาค ๕ — ร่างหนังสือสั่งการเสนอ ผบช.ภาค ๕ อนุมัติ",
  },

  // ── Target unit head (can acknowledge/report) ──
  {
    id: "p-station-pathumwan",
    name: "พ.ต.อ. ปรีดา ฟูธรรม",
    rank: "พ.ต.อ.",
    unitId: "u-sn-2-1", // สน.ปทุมวัน (อยู่ในกลุ่ม บก.น.2)
    role: "ผกก.",
    authority: "APPROVE",
    digitalSignature: "พ.ต.อ. ปรีดา ฟูธรรม",
    description:
      "ผู้กำกับการ สน.ปทุมวัน — รับคำสั่งจากเบื้องบน รับทราบ-เริ่มปฏิบัติ-ส่งผล",
  },
  {
    id: "p-station-cm",
    name: "พ.ต.อ. ธีรพันธ์ บุญเกษม",
    rank: "พ.ต.อ.",
    unitId: "u-prov-5-ชม-st-1", // สภ.เมืองเชียงใหม่
    role: "ผกก.",
    authority: "APPROVE",
    digitalSignature: "พ.ต.อ. ธีรพันธ์ บุญเกษม",
    description: "ผู้กำกับการ สภ.เมืองเชียงใหม่ — หน่วยปฏิบัติงานในภาค ๕",
  },
];

const PERSONA_KEY_GLOBAL = "__activePersona";

export function getActivePersona(): Persona {
  const id =
    (globalThis as Record<string, unknown>)[PERSONA_KEY_GLOBAL] as string | undefined;
  if (id) {
    const found = PERSONAS.find((p) => p.id === id);
    if (found) return found;
  }
  return PERSONAS[0];
}

export function setActivePersona(personaId: string) {
  const found = PERSONAS.find((p) => p.id === personaId);
  if (found) {
    (globalThis as Record<string, unknown>)[PERSONA_KEY_GLOBAL] = personaId;
  }
}

// ─── Stats ─────────────────────────────────────

export interface OrgStats {
  total: number;
  byLevel: Record<string, number>;
  byKind: Record<string, number>;
}

export function getOrgStats(): OrgStats {
  const byLevel: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  for (const u of ALL_UNITS) {
    byLevel[String(u.level)] = (byLevel[String(u.level)] ?? 0) + 1;
    byKind[u.kind] = (byKind[u.kind] ?? 0) + 1;
  }
  return { total: ALL_UNITS.length, byLevel, byKind };
}
