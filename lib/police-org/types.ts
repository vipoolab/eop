// Police organizational structure types
//
// 5-level hierarchy:
//   L0 — ตร. (Royal Thai Police HQ)
//   L1 — บช. / กองบัญชาการ (Bureau-level: บช.น., ตำรวจภูธรภาค ๑-๙, บช.พิเศษ)
//   L2 — บก. / ภ.จว. (Division-level: กองบังคับการ, ตำรวจภูธรจังหวัด)
//   L3 — สน. / สภ. / กก. (Station-level)
//   L4 — งาน / ฝ่าย (sub-station, optional, not used in demo)

export type OrgLevel = 0 | 1 | 2 | 3 | 4;

export type OrgKind =
  | "RTP" // ตร. - top
  | "METRO_BUREAU" // บช.น.
  | "REGIONAL_BUREAU" // ตำรวจภูธรภาค ๑-๙
  | "SPECIAL_BUREAU" // บช.ปส., บช.สอท., ฯลฯ
  | "STAFF_BUREAU" // สยศ.ตร., สลก., ฯลฯ
  | "METRO_DIVISION" // บก.น.๑-๙
  | "SPECIAL_DIVISION" // บก. ภายใต้ บช.พิเศษ
  | "PROVINCIAL_POLICE" // ตำรวจภูธรจังหวัด (ภ.จว.)
  | "METRO_STATION" // สถานีตำรวจนครบาล (สน.)
  | "PROVINCIAL_STATION" // สถานีตำรวจภูธร (สภ.)
  | "SPECIAL_GROUP" // กก./กลุ่มงาน
  | "STATION_DIVISION"; // งาน/ฝ่าย ภายในสถานี (L4)

export interface OrgUnit {
  id: string;
  code: string; // เช่น "ตร.", "บช.น.", "ภ.๕", "สน.ปทุมวัน"
  name: string; // ชื่อเต็ม
  shortName?: string; // ชื่อย่อสำหรับ UI
  kind: OrgKind;
  level: OrgLevel;
  parentId: string | null;
  region?: string; // กรุงเทพ / ภาคเหนือ / ภาคใต้ / ...
  province?: string; // ใช้กับ ภ.จว. และ สภ.
  commanderTitle: string; // "ผบ.ตร.", "ผบช.น.", "ผกก."
  commanderName?: string; // ชื่อคนคุม (mock)
  /** สาย/หน่วยหลักที่รับผิดชอบ — สำหรับ filter เร็วๆ ใน UI */
  responsibilities?: string[];
}

// User role / persona
export type PersonaRole =
  | "ผบ.ตร."
  | "รอง ผบ.ตร."
  | "ผบช."
  | "รอง ผบช."
  | "ผบก."
  | "รอง ผบก."
  | "ผกก."
  | "รอง ผกก.";

/**
 * Authority level — determines whether persona can approve commands.
 *  - APPROVE: can approve submitted drafts (commander-level)
 *  - DRAFT_ONLY: can only draft & submit, must escalate for approval
 */
export type PersonaAuthority = "APPROVE" | "DRAFT_ONLY";

export interface Persona {
  id: string;
  name: string;
  rank: string;
  unitId: string;
  role: PersonaRole;
  authority: PersonaAuthority;
  /** ผู้บังคับบัญชา persona id — drafts go to this persona */
  supervisorPersonaId?: string;
  /** Cached digital signature data (text-only for demo) */
  digitalSignature?: string;
  description: string;
}
