// Summary card showing hierarchy stats

import { Library, BookOpen, ClipboardList, Sigma } from "lucide-react";
import type { PlanSummaryStats, PlanTreeNode } from "@/lib/strategic/types";

interface PlanSummaryProps {
  stats: PlanSummaryStats;
  tree: PlanTreeNode | null;
}

export function PlanSummary({ stats, tree }: PlanSummaryProps) {
  const hasNS = stats.level1Count > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <StatCard
        icon={Library}
        label="ยุทธศาสตร์ชาติ"
        value={stats.level1Count}
        sub={hasNS && tree ? `${countRootItems(tree)} ด้านหลัก` : "ยังไม่มีข้อมูล"}
        accent="navy"
      />
      <StatCard
        icon={BookOpen}
        label="แผนแม่บท"
        value={stats.level2Count}
        sub="ภายใต้ยุทธศาสตร์ชาติ"
        accent="gold"
      />
      <StatCard
        icon={ClipboardList}
        label="แผนปฏิบัติราชการ"
        value={stats.level3Count}
        sub="ของ สตช."
        accent="slate"
      />
      <StatCard
        icon={Sigma}
        label="ข้อทั้งหมด"
        value={stats.totalItems}
        sub={
          stats.lastUpdatedAt
            ? `อัปเดตล่าสุด ${new Date(stats.lastUpdatedAt).toLocaleDateString("th-TH")}`
            : "—"
        }
        accent="emerald"
      />
    </div>
  );
}

function countRootItems(node: PlanTreeNode): number {
  return node.items.length;
}

type Accent = "navy" | "gold" | "slate" | "emerald";

const accentStyles: Record<Accent, string> = {
  navy: "border-[#1e3a5f]/20 bg-gradient-to-br from-white to-[#1e3a5f]/[0.03]",
  gold: "border-[#b8860b]/30 bg-gradient-to-br from-white to-[#b8860b]/[0.04]",
  slate: "border-slate-200 bg-white",
  emerald: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50",
};

const iconStyles: Record<Accent, string> = {
  navy: "bg-[#1e3a5f] text-white",
  gold: "bg-[#b8860b] text-white",
  slate: "bg-slate-500 text-white",
  emerald: "bg-emerald-600 text-white",
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  accent: Accent;
}

function StatCard({ icon: Icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-sm border p-4 ${accentStyles[accent]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-1 leading-none">
            {value}
          </div>
          {sub && (
            <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div>
          )}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${iconStyles[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
