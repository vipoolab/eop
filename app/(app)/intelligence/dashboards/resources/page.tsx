// /intelligence/dashboards/resources — Resources dashboard

import Link from "next/link";
import {
  Warehouse,
  ChevronLeft,
  Users,
  Car,
  Smartphone,
  Building,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

interface UnitResource {
  unit: string;
  personnel: { active: number; total: number };
  vehicles: { active: number; total: number };
  equipment: { working: number; total: number };
}

const UNITS_RESOURCES: UnitResource[] = [
  { unit: "บช.น.", personnel: { active: 24820, total: 26500 }, vehicles: { active: 1850, total: 2080 }, equipment: { working: 4250, total: 4520 } },
  { unit: "ภ.๑", personnel: { active: 12450, total: 13200 }, vehicles: { active: 920, total: 1050 }, equipment: { working: 2350, total: 2520 } },
  { unit: "ภ.๒", personnel: { active: 14820, total: 15600 }, vehicles: { active: 1120, total: 1250 }, equipment: { working: 2850, total: 3050 } },
  { unit: "ภ.๓", personnel: { active: 18200, total: 19500 }, vehicles: { active: 1420, total: 1620 }, equipment: { working: 3450, total: 3720 } },
  { unit: "ภ.๔", personnel: { active: 16400, total: 17800 }, vehicles: { active: 1280, total: 1440 }, equipment: { working: 3120, total: 3380 } },
  { unit: "ภ.๕", personnel: { active: 13800, total: 14600 }, vehicles: { active: 1080, total: 1200 }, equipment: { working: 2680, total: 2840 } },
  { unit: "ภ.๖", personnel: { active: 11250, total: 12100 }, vehicles: { active: 850, total: 980 }, equipment: { working: 2150, total: 2320 } },
  { unit: "ภ.๗", personnel: { active: 12800, total: 13500 }, vehicles: { active: 920, total: 1040 }, equipment: { working: 2480, total: 2640 } },
  { unit: "ภ.๘", personnel: { active: 9850, total: 10500 }, vehicles: { active: 780, total: 880 }, equipment: { working: 1980, total: 2120 } },
  { unit: "ภ.๙", personnel: { active: 13800, total: 14800 }, vehicles: { active: 1050, total: 1200 }, equipment: { working: 2680, total: 2900 } },
  { unit: "บช.ปส.", personnel: { active: 3850, total: 4100 }, vehicles: { active: 420, total: 480 }, equipment: { working: 1280, total: 1380 } },
  { unit: "บช.สอท.", personnel: { active: 2480, total: 2600 }, vehicles: { active: 180, total: 220 }, equipment: { working: 1820, total: 1950 } },
  { unit: "บช.ก.", personnel: { active: 5680, total: 6100 }, vehicles: { active: 520, total: 580 }, equipment: { working: 1480, total: 1620 } },
  { unit: "บช.ทท.", personnel: { active: 1820, total: 1950 }, vehicles: { active: 220, total: 250 }, equipment: { working: 680, total: 720 } },
  { unit: "บช.ตชด.", personnel: { active: 9850, total: 10500 }, vehicles: { active: 820, total: 940 }, equipment: { working: 2280, total: 2480 } },
];

export default function ResourcesDashboardPage() {
  const totalPersonnel = UNITS_RESOURCES.reduce(
    (acc, u) => ({
      active: acc.active + u.personnel.active,
      total: acc.total + u.personnel.total,
    }),
    { active: 0, total: 0 }
  );
  const totalVehicles = UNITS_RESOURCES.reduce(
    (acc, u) => ({
      active: acc.active + u.vehicles.active,
      total: acc.total + u.vehicles.total,
    }),
    { active: 0, total: 0 }
  );
  const totalEquipment = UNITS_RESOURCES.reduce(
    (acc, u) => ({
      working: acc.working + u.equipment.working,
      total: acc.total + u.equipment.total,
    }),
    { working: 0, total: 0 }
  );
  const buildings = 1842;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Warehouse}
        eyebrow="แดชบอร์ดเฉพาะทาง"
        title="แดชบอร์ดทรัพยากร (Resources)"
        description="ภาพรวมกำลังพลตำรวจ ยานพาหนะ และอุปกรณ์ในแต่ละ บช. ทั่วประเทศ"
        actions={
          <Link
            href="/intelligence/dashboards"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      {/* Total stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat
          icon={Users}
          label="กำลังพลรวม"
          value={totalPersonnel.active}
          total={totalPersonnel.total}
          unit="นาย"
          accent="navy"
        />
        <BigStat
          icon={Car}
          label="ยานพาหนะ"
          value={totalVehicles.active}
          total={totalVehicles.total}
          unit="คัน"
          accent="blue"
        />
        <BigStat
          icon={Smartphone}
          label="อุปกรณ์"
          value={totalEquipment.working}
          total={totalEquipment.total}
          unit="ชิ้น"
          accent="emerald"
        />
        <BigStat
          icon={Building}
          label="หน่วยทั่วประเทศ"
          value={buildings}
          total={buildings}
          unit="หน่วย"
          accent="amber"
        />
      </div>

      {/* Table */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ทรัพยากรของแต่ละ บช. (อัตราพร้อมปฏิบัติงาน)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2 font-semibold">บช.</th>
                <th className="text-right px-3 py-2 font-semibold">กำลังพล</th>
                <th className="text-right px-3 py-2 font-semibold">% พร้อม</th>
                <th className="text-right px-3 py-2 font-semibold">ยานพาหนะ</th>
                <th className="text-right px-3 py-2 font-semibold">% พร้อม</th>
                <th className="text-right px-3 py-2 font-semibold">อุปกรณ์</th>
                <th className="text-right px-3 py-2 font-semibold">% พร้อม</th>
              </tr>
            </thead>
            <tbody>
              {UNITS_RESOURCES.map((u) => {
                const pp = (u.personnel.active / u.personnel.total) * 100;
                const vp = (u.vehicles.active / u.vehicles.total) * 100;
                const ep = (u.equipment.working / u.equipment.total) * 100;
                return (
                  <tr key={u.unit} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-semibold text-slate-900">{u.unit}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">
                      {u.personnel.active.toLocaleString("th-TH")}
                      <span className="text-slate-400 ml-1">/ {u.personnel.total.toLocaleString("th-TH")}</span>
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <PctBadge pct={pp} />
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums">
                      {u.vehicles.active.toLocaleString("th-TH")}
                      <span className="text-slate-400 ml-1">/ {u.vehicles.total.toLocaleString("th-TH")}</span>
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <PctBadge pct={vp} />
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums">
                      {u.equipment.working.toLocaleString("th-TH")}
                      <span className="text-slate-400 ml-1">/ {u.equipment.total.toLocaleString("th-TH")}</span>
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <PctBadge pct={ep} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-[11px] text-slate-500 italic">
        * ข้อมูลทรัพยากรเป็น mock data สำหรับ Demo — ไม่ใช่ข้อมูลจริง
      </div>
    </div>
  );
}

function PctBadge({ pct }: { pct: number }) {
  const color =
    pct >= 95
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : pct >= 90
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : pct >= 85
          ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-red-100 text-red-800 border-red-200";
  return (
    <span
      className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-sm border ${color}`}
    >
      {pct.toFixed(1)}%
    </span>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  total,
  unit,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total: number;
  unit: string;
  accent: "navy" | "blue" | "emerald" | "amber";
}) {
  const colors: Record<typeof accent, string> = {
    navy: "bg-[#1e3a5f] text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-sm flex items-center justify-center ${colors[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums leading-none mt-1">
            {value.toLocaleString("th-TH")} {unit}
          </div>
        </div>
      </div>
      <div className="mt-2.5">
        <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-slate-500 mt-1 text-right tabular-nums">
          {pct.toFixed(1)}% พร้อมปฏิบัติงาน
        </div>
      </div>
    </div>
  );
}
