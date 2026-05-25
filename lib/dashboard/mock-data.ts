// Mock data generator for analytics dashboard.
// Deterministic (seeded) so charts stay stable across re-renders.

export type CommandType =
  | "ปราบปราม"
  | "จราจร"
  | "สืบสวน"
  | "ป้องกัน"
  | "การข่าวกรอง"
  | "ทั่วไป";

export const COMMAND_TYPES: CommandType[] = [
  "ปราบปราม",
  "จราจร",
  "สืบสวน",
  "ป้องกัน",
  "การข่าวกรอง",
  "ทั่วไป",
];

export const COMMAND_TYPE_COLORS: Record<CommandType, string> = {
  "ปราบปราม": "#dc2626",
  "จราจร": "#f59e0b",
  "สืบสวน": "#3b82f6",
  "ป้องกัน": "#10b981",
  "การข่าวกรอง": "#8b5cf6",
  "ทั่วไป": "#64748b",
};

export interface RegionInfo {
  region: string;
  unitId: string;
  unitName: string;
  provinces: { name: string; lat: number; lng: number; weight: number }[];
}

export const REGIONS: RegionInfo[] = [
  {
    region: "นครบาล (กทม.)",
    unitId: "u-bch-na",
    unitName: "บช.น.",
    provinces: [{ name: "กรุงเทพมหานคร", lat: 13.7563, lng: 100.5018, weight: 1.0 }],
  },
  {
    region: "ภาค ๑ (ภาคกลาง)",
    unitId: "u-bch-1",
    unitName: "ภ.๑",
    provinces: [
      { name: "นนทบุรี", lat: 13.8622, lng: 100.5147, weight: 0.6 },
      { name: "ปทุมธานี", lat: 14.0208, lng: 100.5253, weight: 0.6 },
      { name: "พระนครศรีอยุธยา", lat: 14.3692, lng: 100.5876, weight: 0.5 },
      { name: "สมุทรปราการ", lat: 13.5990, lng: 100.5998, weight: 0.7 },
    ],
  },
  {
    region: "ภาค ๒ (ภาคตะวันออก)",
    unitId: "u-bch-2",
    unitName: "ภ.๒",
    provinces: [
      { name: "ชลบุรี", lat: 13.3611, lng: 100.9847, weight: 0.85 },
      { name: "ระยอง", lat: 12.6814, lng: 101.2816, weight: 0.55 },
      { name: "จันทบุรี", lat: 12.6111, lng: 102.1038, weight: 0.4 },
    ],
  },
  {
    region: "ภาค ๓ (ภาคอีสานล่าง)",
    unitId: "u-bch-3",
    unitName: "ภ.๓",
    provinces: [
      { name: "นครราชสีมา", lat: 14.9799, lng: 102.0978, weight: 0.7 },
      { name: "บุรีรัมย์", lat: 14.9930, lng: 103.1029, weight: 0.5 },
      { name: "สุรินทร์", lat: 14.8825, lng: 103.4937, weight: 0.45 },
      { name: "อุบลราชธานี", lat: 15.2287, lng: 104.8567, weight: 0.5 },
    ],
  },
  {
    region: "ภาค ๔ (ภาคอีสานบน)",
    unitId: "u-bch-4",
    unitName: "ภ.๔",
    provinces: [
      { name: "ขอนแก่น", lat: 16.4419, lng: 102.8360, weight: 0.65 },
      { name: "อุดรธานี", lat: 17.4138, lng: 102.7872, weight: 0.55 },
      { name: "หนองคาย", lat: 17.8782, lng: 102.7412, weight: 0.45 },
      { name: "เลย", lat: 17.4860, lng: 101.7223, weight: 0.35 },
    ],
  },
  {
    region: "ภาค ๕ (ภาคเหนือบน)",
    unitId: "u-bch-5",
    unitName: "ภ.๕",
    provinces: [
      { name: "เชียงใหม่", lat: 18.7883, lng: 98.9853, weight: 0.75 },
      { name: "เชียงราย", lat: 19.9105, lng: 99.8406, weight: 0.55 },
      { name: "ลำปาง", lat: 18.2855, lng: 99.5128, weight: 0.4 },
      { name: "ลำพูน", lat: 18.5746, lng: 99.0087, weight: 0.35 },
    ],
  },
  {
    region: "ภาค ๖ (ภาคเหนือล่าง)",
    unitId: "u-bch-6",
    unitName: "ภ.๖",
    provinces: [
      { name: "พิษณุโลก", lat: 16.8211, lng: 100.2659, weight: 0.5 },
      { name: "นครสวรรค์", lat: 15.7047, lng: 100.1372, weight: 0.5 },
      { name: "ตาก", lat: 16.8839, lng: 99.1258, weight: 0.4 },
    ],
  },
  {
    region: "ภาค ๗ (ภาคตะวันตก)",
    unitId: "u-bch-7",
    unitName: "ภ.๗",
    provinces: [
      { name: "นครปฐม", lat: 13.8199, lng: 100.0444, weight: 0.55 },
      { name: "ราชบุรี", lat: 13.5283, lng: 99.8138, weight: 0.4 },
      { name: "กาญจนบุรี", lat: 14.0227, lng: 99.5328, weight: 0.45 },
    ],
  },
  {
    region: "ภาค ๘ (ภาคใต้บน)",
    unitId: "u-bch-8",
    unitName: "ภ.๘",
    provinces: [
      { name: "ภูเก็ต", lat: 7.8804, lng: 98.3923, weight: 0.7 },
      { name: "สุราษฎร์ธานี", lat: 9.1382, lng: 99.3215, weight: 0.55 },
      { name: "กระบี่", lat: 8.0863, lng: 98.9063, weight: 0.5 },
      { name: "พังงา", lat: 8.4509, lng: 98.5251, weight: 0.4 },
    ],
  },
  {
    region: "ภาค ๙ (ภาคใต้ล่าง)",
    unitId: "u-bch-9",
    unitName: "ภ.๙",
    provinces: [
      { name: "สงขลา", lat: 7.1896, lng: 100.5950, weight: 0.6 },
      { name: "ยะลา", lat: 6.5413, lng: 101.2806, weight: 0.55 },
      { name: "ปัตตานี", lat: 6.8693, lng: 101.2503, weight: 0.5 },
      { name: "นราธิวาส", lat: 6.4254, lng: 101.8253, weight: 0.5 },
    ],
  },
];

export interface DataPoint {
  date: string;       // ISO YYYY-MM-DD
  year: number;
  month: number;      // 1-12
  unitId: string;
  unitName: string;
  region: string;
  province: string;
  provinceLat: number;
  provinceLng: number;
  commandType: CommandType;
  commandsIssued: number;
  commandsCompleted: number;
  commandsLate: number;
  incidents: number;
  arrests: number;
}

// ── Seeded RNG (Mulberry32) for deterministic mock data ─────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h >>> 0;
}

// ── Generator ─────────────────────────────────────

let _cache: DataPoint[] | null = null;

/**
 * Generate ~3 years of daily mock data per region × province × command type.
 * Sample rate ~30% to keep dataset manageable (~5000-8000 records).
 */
export function getDashboardData(): DataPoint[] {
  if (_cache) return _cache;

  const rand = mulberry32(20690525);
  const out: DataPoint[] = [];

  // 3 years: 2567, 2568, 2569 BE (=2024, 2025, 2026 CE)
  const startYear = 2024;
  const totalDays = 365 * 3 + 1; // ~3 years

  const start = new Date(startYear, 0, 1);

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const dow = date.getDay(); // 0=Sun..6=Sat

    for (const region of REGIONS) {
      // Pick one province for this row
      const province = region.provinces[Math.floor(rand() * region.provinces.length)];
      for (const cmdType of COMMAND_TYPES) {
        // Skip ~70% to keep dataset manageable
        if (rand() > 0.3) continue;

        // Seasonal factors
        let seasonalMult = 1.0;
        // High Season for tourism (Dec-Feb) — boost South
        if ((month === 12 || month <= 2) && region.region.includes("ใต้")) {
          seasonalMult *= 1.4;
        }
        // Songkran (April) — boost traffic in all regions
        if (month === 4 && cmdType === "จราจร") {
          seasonalMult *= 1.6;
        }
        // New Year (Dec-Jan) — boost traffic
        if ((month === 12 || month === 1) && cmdType === "จราจร") {
          seasonalMult *= 1.5;
        }
        // Weekend boost for prevention/incidents
        if ((dow === 0 || dow === 6) && (cmdType === "ป้องกัน" || cmdType === "ปราบปราม")) {
          seasonalMult *= 1.15;
        }

        // Regional bias
        let regionMult = province.weight;
        // Drug-related heavy in northeast border
        if (cmdType === "ปราบปราม" && (region.unitName === "ภ.๔" || region.unitName === "ภ.๓")) {
          regionMult *= 1.3;
        }
        // Tourist crime in South
        if (cmdType === "จราจร" && region.unitName === "ภ.๘") {
          regionMult *= 1.2;
        }
        // Investigation heavy in metro
        if (cmdType === "สืบสวน" && region.unitName === "บช.น.") {
          regionMult *= 1.5;
        }

        // Year-over-year growth (5% per year)
        const yearMult = 1 + (year - startYear) * 0.05;

        const baseIssued = 2 + Math.floor(rand() * 10);
        const commandsIssued = Math.max(
          0,
          Math.round(baseIssued * regionMult * seasonalMult * yearMult)
        );
        const completionRate = 0.65 + rand() * 0.25; // 65-90%
        const commandsCompleted = Math.round(commandsIssued * completionRate);
        const lateRate = 0.05 + rand() * 0.15; // 5-20% late
        const commandsLate = Math.round(commandsIssued * lateRate);

        // Incidents scale with command activity
        const incidents = Math.round(
          commandsIssued * (0.5 + rand() * 1.0) * regionMult
        );
        const arrests = Math.round(
          incidents * (0.3 + rand() * 0.4) * (cmdType === "ปราบปราม" ? 1.4 : 1.0)
        );

        out.push({
          date: date.toISOString().slice(0, 10),
          year,
          month,
          unitId: region.unitId,
          unitName: region.unitName,
          region: region.region,
          province: province.name,
          provinceLat: province.lat,
          provinceLng: province.lng,
          commandType: cmdType,
          commandsIssued,
          commandsCompleted,
          commandsLate,
          incidents,
          arrests,
        });
      }
    }
  }

  _cache = out;
  return out;
}
