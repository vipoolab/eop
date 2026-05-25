// /overview — Executive Dashboard รวมทุกระบบ (System 1, 2, 3, 4, 6)

import Link from "next/link";
import {
  LayoutDashboard,
  Siren,
  FileEdit,
  ClipboardList,
  Brain,
  Library,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Activity,
  Building2,
  Search,
  Plus,
  MapPin,
  Radio,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listCommands, getCommandStats } from "@/lib/commands/store";
import { listAssessments } from "@/lib/assessments/store";
import { getStats as getStrategicStats, listDocuments as listPlans } from "@/lib/strategic/store";
import {
  getIntelStats,
  listIncidents,
  listTrends,
  countIncidentsByProvince,
} from "@/lib/intelligence/store";
import { computeUnitLateStatuses } from "@/lib/commands/workflow";
import { getActivePersona, getUnit } from "@/lib/police-org/store";
import type { Command } from "@/lib/commands/types";
import type { Assessment } from "@/lib/assessments/types";
import { ExecutivePulse } from "./executive-pulse";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const persona = getActivePersona();
  const personaUnit = getUnit(persona.unitId);

  // ── Data from all systems ──
  const allCommands = listCommands();
  const cmdStats = getCommandStats();
  const emergencyCommands = allCommands.filter(
    (c) => c.priority === "EMERGENCY" && c.status !== "CLOSED"
  );
  const activeCommands = allCommands.filter(
    (c) => c.status === "DISPATCHED" || c.status === "IN_PROGRESS"
  );

  // Late units across all active commands
  let totalLateUnits = 0;
  const lateCommands: { cmd: Command; lateCount: number }[] = [];
  for (const c of activeCommands) {
    const lates = computeUnitLateStatuses(c).filter((s) => s.isLate).length;
    if (lates > 0) {
      totalLateUnits += lates;
      lateCommands.push({ cmd: c, lateCount: lates });
    }
  }
  lateCommands.sort((a, b) => b.lateCount - a.lateCount);

  // Assessments
  const allAssessments = listAssessments();
  const dueAssessments = allAssessments
    .filter((a) => a.status === "PUBLISHED")
    .map((a) => {
      const totalUnits = a.targetUnitIds.length;
      const submitted = new Set(a.submissions.map((s) => s.unitId)).size;
      const due = new Date(a.dueDate).getTime();
      const daysLeft = Math.ceil((due - Date.now()) / (24 * 60 * 60 * 1000));
      return { a, totalUnits, submitted, daysLeft };
    })
    .sort((x, y) => x.daysLeft - y.daysLeft);

  // Strategic
  const strategicStats = getStrategicStats();
  const plans = listPlans();

  // Intelligence
  const intelStats = getIntelStats();
  const recentIncidents = listIncidents({ daysWithin: 7 })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 6);
  const criticalIncidents = listIncidents({ daysWithin: 7 }).filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );
  const provinceCounts = countIncidentsByProvince();
  const topHotspots = Object.entries(provinceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const trends = listTrends();
  const upTrends = trends
    .filter((t) => {
      const last = t.historical[t.historical.length - 1]?.value ?? 0;
      const pred = t.predicted[t.predicted.length - 1]?.value ?? 0;
      return pred > last * 1.05;
    })
    .sort((a, b) => {
      const aGrowth = (a.predicted.at(-1)?.value ?? 0) / (a.historical.at(-1)?.value ?? 1);
      const bGrowth = (b.predicted.at(-1)?.value ?? 0) / (b.historical.at(-1)?.value ?? 1);
      return bGrowth - aGrowth;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="EXECUTIVE DASHBOARD"
        title="ภาพรวมระบบ"
        description={`สถานะระบบทั้งหมดในมุมมองเดียว — ${persona.rank} ${persona.name.split(" ").slice(1).join(" ")} (${personaUnit?.shortName ?? personaUnit?.code ?? ""})`}
        live
        actions={<ExecutivePulse />}
      />

      {/* ── EMERGENCY ALERT BANNER ── */}
      {emergencyCommands.length > 0 && (
        <Link href="/commands/emergency" className="block group">
          <div className="rounded-sm border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-sm bg-red-600 flex items-center justify-center shrink-0 animate-pulse">
                <Siren className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-red-700 dark:text-red-300">
                    ⚠ Emergency Alert
                  </span>
                  <span className="text-[10px] font-mono text-red-600">LIVE</span>
                </div>
                <div className="text-base font-bold text-red-900 dark:text-red-100 mt-0.5">
                  มีเหตุฉุกเฉิน {emergencyCommands.length} เหตุที่กำลังจัดการ
                </div>
                <div className="text-xs text-red-700 dark:text-red-300 mt-1 line-clamp-1">
                  {emergencyCommands.slice(0, 2).map((c) => c.emergency?.location ?? c.letter.subject).join(" · ")}
                </div>
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5 rounded-sm bg-red-600 text-white px-4 py-2 font-semibold text-sm group-hover:bg-red-700">
                ดู EOC
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── HERO STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <BigStat
          label="เหตุฉุกเฉิน"
          value={emergencyCommands.length}
          icon={Siren}
          color="red"
          href="/commands/emergency"
          pulse={emergencyCommands.length > 0}
        />
        <BigStat
          label="คำสั่งกำลังปฏิบัติ"
          value={activeCommands.length}
          icon={FileEdit}
          color="blue"
          href="/commands"
          sublabel={`${cmdStats.total} ทั้งหมด`}
        />
        <BigStat
          label="หน่วยที่ล่าช้า"
          value={totalLateUnits}
          icon={AlertTriangle}
          color={totalLateUnits > 0 ? "amber" : "slate"}
          href="/commands"
          sublabel={`${lateCommands.length} คำสั่ง`}
        />
        <BigStat
          label="แบบประเมินรอส่ง"
          value={dueAssessments.reduce((s, x) => s + (x.totalUnits - x.submitted), 0)}
          icon={ClipboardList}
          color="purple"
          href="/assessments"
          sublabel={`${dueAssessments.length} แบบประเมินใช้งาน`}
        />
        <BigStat
          label="เหตุการณ์ 7 วัน"
          value={listIncidents({ daysWithin: 7 }).length}
          icon={Activity}
          color="cyan"
          href="/intelligence/heatmap"
          sublabel={`Critical/High: ${criticalIncidents.length}`}
        />
        <BigStat
          label="แผนยุทธศาสตร์"
          value={strategicStats.totalItems}
          icon={Library}
          color="emerald"
          href="/strategic"
          sublabel={`${strategicStats.level1Count + strategicStats.level2Count + strategicStats.level3Count} เอกสาร`}
        />
      </div>

      {/* ── TWO-COLUMN MAIN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Commands + Strategy */}
        <div className="space-y-5">
          {/* Active commands by status */}
          <Section
            title="สถานะหนังสือสั่งการ"
            icon={FileEdit}
            href="/commands"
            sub="รวมทุกสถานะในระบบ"
          >
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MiniStat label="เผยแพร่" value={cmdStats.byStatus.DISPATCHED} color="blue" />
              <MiniStat label="กำลังปฏิบัติ" value={cmdStats.byStatus.IN_PROGRESS} color="amber" />
              <MiniStat label="ปิดงาน" value={cmdStats.byStatus.CLOSED} color="emerald" />
            </div>
            <div className="space-y-1.5">
              {activeCommands.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/commands/${c.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  {c.priority === "EMERGENCY" && (
                    <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-sm shrink-0 animate-pulse">
                      EMERGENCY
                    </span>
                  )}
                  {c.priority === "URGENT" && (
                    <span className="text-[9px] font-bold text-white bg-amber-600 px-1.5 py-0.5 rounded-sm shrink-0">
                      URGENT
                    </span>
                  )}
                  <span className="text-sm text-slate-800 dark:text-slate-200 truncate flex-1">
                    {c.letter.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {c.effectiveUnitIds.length} หน่วย
                  </span>
                </Link>
              ))}
              {activeCommands.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-3">
                  ไม่มีคำสั่งที่กำลังปฏิบัติ
                </div>
              )}
            </div>
          </Section>

          {/* Late units alert */}
          {lateCommands.length > 0 && (
            <Section
              title="คำสั่งที่มีหน่วยล่าช้า"
              icon={AlertTriangle}
              accent="amber"
              sub="ต้องเร่งติดตาม"
            >
              <div className="space-y-1.5">
                {lateCommands.slice(0, 4).map(({ cmd, lateCount }) => (
                  <Link
                    key={cmd.id}
                    href={`/commands/${cmd.id}/track`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-sm text-amber-900 dark:text-amber-100 truncate flex-1">
                      {cmd.letter.subject}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                      {lateCount} หน่วยล่าช้า
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Strategic alignment */}
          <Section
            title="แผนยุทธศาสตร์ ๓ ระดับ"
            icon={Library}
            href="/strategic"
            sub="แผนที่ load เข้าระบบ"
          >
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MiniStat
                label="L1 ชาติ"
                value={strategicStats.level1Count}
                color="navy"
              />
              <MiniStat label="L2 แม่บท" value={strategicStats.level2Count} color="blue" />
              <MiniStat label="L3 ปฏิบัติ" value={strategicStats.level3Count} color="emerald" />
            </div>
            <div className="space-y-1">
              {plans.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="text-xs text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5"
                >
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    L{p.level}
                  </span>
                  {p.title}
                </div>
              ))}
              {plans.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">
                  ยังไม่มีแผนยุทธศาสตร์ในระบบ
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* RIGHT: Assessments + Intel */}
        <div className="space-y-5">
          {/* Due assessments */}
          <Section
            title="แบบประเมินที่ใกล้กำหนด"
            icon={ClipboardList}
            href="/assessments"
            sub={`${dueAssessments.length} แบบประเมินที่ใช้งาน`}
            accent={dueAssessments.some((d) => d.daysLeft <= 7) ? "amber" : "default"}
          >
            <div className="space-y-1.5">
              {dueAssessments.slice(0, 4).map(({ a, totalUnits, submitted, daysLeft }) => {
                const pct = totalUnits > 0 ? Math.round((submitted / totalUnits) * 100) : 0;
                return (
                  <Link
                    key={a.id}
                    href={`/assessments/${a.id}`}
                    className="block px-2.5 py-2 rounded-sm border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 shrink-0">
                        {a.category}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                        {a.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold shrink-0 ${
                          daysLeft <= 7
                            ? "text-red-600"
                            : daysLeft <= 14
                            ? "text-amber-600"
                            : "text-slate-500"
                        }`}
                      >
                        {daysLeft < 0 ? `เลย ${Math.abs(daysLeft)} วัน` : `${daysLeft} วัน`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${
                            pct >= 75
                              ? "bg-emerald-500"
                              : pct >= 40
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {submitted}/{totalUnits} ({pct}%)
                      </span>
                    </div>
                  </Link>
                );
              })}
              {dueAssessments.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-3">
                  ไม่มีแบบประเมินที่กำลังใช้งาน
                </div>
              )}
            </div>
          </Section>

          {/* Recent incidents */}
          <Section
            title="เหตุการณ์ล่าสุดในระบบ"
            icon={MapPin}
            href="/intelligence/heatmap"
            sub={`${listIncidents({ daysWithin: 7 }).length} เหตุใน 7 วัน · ${criticalIncidents.length} วิกฤต`}
            accent={criticalIncidents.length > 5 ? "amber" : "default"}
          >
            <div className="space-y-1">
              {recentIncidents.map((i) => {
                const severity =
                  i.severity === "CRITICAL"
                    ? { color: "bg-red-600 text-white", label: "วิกฤต" }
                    : i.severity === "HIGH"
                    ? { color: "bg-amber-500 text-white", label: "สูง" }
                    : i.severity === "MEDIUM"
                    ? { color: "bg-blue-500 text-white", label: "กลาง" }
                    : { color: "bg-slate-400 text-white", label: "ต่ำ" };
                return (
                  <div
                    key={i.id}
                    className="flex items-center gap-2 px-2 py-1 text-xs"
                  >
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm shrink-0 ${severity.color}`}
                    >
                      {severity.label}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 shrink-0">{i.type}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate flex-1">
                      {i.location.district}, {i.location.province}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(i.occurredAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Top hotspots */}
          <Section
            title="Top จุดเสี่ยง (Hotspots)"
            icon={Zap}
            href="/intelligence/heatmap"
            sub="จังหวัดที่มีเหตุการณ์มากที่สุด (30 วัน)"
          >
            <div className="space-y-1.5">
              {topHotspots.map(([province, count], idx) => (
                <div key={province} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 w-6">#{idx + 1}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">
                    {province}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden max-w-[120px]">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{
                        width: `${(count / (topHotspots[0]?.[1] ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 w-12 text-right">
                    {count} เหตุ
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── AI INSIGHTS ── */}
      <Section
        title="AI Insights — แนวโน้มที่ต้องเฝ้าระวัง"
        icon={Sparkles}
        href="/intelligence/predict"
        sub="พยากรณ์โดยระบบ AI · ดูรายละเอียดเพิ่มเติม"
        accent="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {upTrends.map((t) => {
            const last = t.historical.at(-1)?.value ?? 0;
            const pred = t.predicted.at(-1)?.value ?? 0;
            const change = last > 0 ? Math.round(((pred - last) / last) * 100) : 0;
            return (
              <Link
                key={t.id}
                href="/intelligence/predict"
                className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      change > 20
                        ? "text-red-600"
                        : change > 10
                        ? "text-amber-600"
                        : "text-blue-600"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    +{change}%
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {t.metric}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {t.recommendation}
                </div>
              </Link>
            );
          })}
          {upTrends.length === 0 && (
            <div className="col-span-3 text-sm text-slate-400 text-center py-4">
              ไม่มีแนวโน้มที่ต้องเฝ้าระวังในขณะนี้
            </div>
          )}
        </div>
      </Section>

      {/* ── QUICK ACTIONS ── */}
      <section className="rounded-sm border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          ดำเนินการที่ใช้บ่อย
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <QuickAction
            href="/commands/new?priority=EMERGENCY"
            icon={Siren}
            label="สั่งการฉุกเฉิน"
            color="red"
          />
          <QuickAction
            href="/commands/new"
            icon={Plus}
            label="ร่างหนังสือใหม่"
            color="navy"
          />
          <QuickAction
            href="/intelligence/search"
            icon={Search}
            label="ค้นหาทุกระบบ"
            color="blue"
          />
          <QuickAction
            href="/intelligence/summary"
            icon={Sparkles}
            label="สรุปผู้บริหาร"
            color="purple"
          />
          <QuickAction
            href="/assessments/new"
            icon={ClipboardList}
            label="ออกแบบประเมิน"
            color="amber"
          />
          <QuickAction href="/inbox" icon={Activity} label="งานรอ" color="emerald" />
        </div>
      </section>
    </div>
  );
}

// ── Components ────────────────────────────────

interface BigStatProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "red" | "blue" | "amber" | "purple" | "cyan" | "emerald" | "slate";
  href?: string;
  sublabel?: string;
  pulse?: boolean;
}

function BigStat({ label, value, icon: Icon, color, href, sublabel, pulse }: BigStatProps) {
  const colorMap = {
    red: "bg-red-600 text-white border-red-700",
    blue: "bg-blue-600 text-white border-blue-700",
    amber: "bg-amber-600 text-white border-amber-700",
    purple: "bg-purple-600 text-white border-purple-700",
    cyan: "bg-cyan-600 text-white border-cyan-700",
    emerald: "bg-emerald-600 text-white border-emerald-700",
    slate: "bg-slate-400 text-white border-slate-500",
  };

  const content = (
    <div
      className={`rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${
        href ? "hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0 ${colorMap[color]} ${
            pulse ? "animate-pulse" : ""
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">
        {value.toLocaleString()}
      </div>
      {sublabel && (
        <div className="text-[10px] text-slate-500 mt-1 leading-tight">{sublabel}</div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  href?: string;
  sub?: string;
  accent?: "default" | "amber" | "red";
}

function Section({ title, icon: Icon, children, href, sub, accent = "default" }: SectionProps) {
  const accentStyle =
    accent === "amber"
      ? "border-amber-300 dark:border-amber-700"
      : accent === "red"
      ? "border-red-300 dark:border-red-700"
      : "border-slate-200 dark:border-slate-800";

  return (
    <section
      className={`rounded-sm border ${accentStyle} bg-white dark:bg-slate-900 overflow-hidden`}
    >
      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#1e3a5f] dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          {sub && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-[11px] text-[#1e3a5f] dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
          >
            ดูทั้งหมด
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "navy" | "blue" | "amber" | "emerald";
}) {
  const colorMap = {
    navy: "bg-[#1e3a5f]/10 text-[#1e3a5f]",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-sm px-2 py-1.5 text-center ${colorMap[color]}`}>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: "red" | "navy" | "blue" | "purple" | "amber" | "emerald";
}) {
  const colorMap = {
    red: "border-red-300 hover:bg-red-50 hover:border-red-500 dark:hover:bg-red-900/20 text-red-700",
    navy: "border-slate-300 hover:bg-slate-100 hover:border-slate-500 dark:hover:bg-slate-800 text-[#1e3a5f] dark:text-slate-200",
    blue: "border-blue-300 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-900/20 text-blue-700",
    purple: "border-purple-300 hover:bg-purple-50 hover:border-purple-500 dark:hover:bg-purple-900/20 text-purple-700",
    amber: "border-amber-300 hover:bg-amber-50 hover:border-amber-500 dark:hover:bg-amber-900/20 text-amber-700",
    emerald: "border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 dark:hover:bg-emerald-900/20 text-emerald-700",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm border bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium transition-colors ${colorMap[color]}`}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
