// Strategic Alignment — แผนยุทธศาสตร์ 3 ระดับ

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Target, ArrowDown, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

const LEVEL_META = {
  NATIONAL: {
    label: "ยุทธศาสตร์ชาติ",
    color: "bg-[#1e3a5f] text-white",
    accent: "border-l-[#1e3a5f]",
  },
  MASTER: {
    label: "แผนแม่บท",
    color: "bg-[#b8860b] text-white",
    accent: "border-l-[#b8860b]",
  },
  ACTION: {
    label: "แผนปฏิบัติราชการ",
    color: "bg-emerald-700 text-white",
    accent: "border-l-emerald-700",
  },
} as const;

interface Plan {
  id: string;
  code: string;
  title: string;
  description: string | null;
  level: string;
  parentId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export default async function StrategicAlignmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plans = await prisma.strategicPlan.findMany({
    orderBy: { startDate: "asc" },
  });

  // Build parent → children map ONCE (avoid O(n²) re-filter in recursive PlanNode)
  const childrenByParent = new Map<string, Plan[]>();
  for (const p of plans) {
    if (!p.parentId) continue;
    const list = childrenByParent.get(p.parentId);
    if (list) list.push(p);
    else childrenByParent.set(p.parentId, [p]);
  }

  const national = plans.filter((p) => p.level === "NATIONAL");
  const master = plans.filter((p) => p.level === "MASTER");
  const action = plans.filter((p) => p.level === "ACTION");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Target}
        eyebrow="Strategic Planning"
        title="ความสอดคล้องของแผนยุทธศาสตร์"
        description="ผังการถ่ายทอดยุทธศาสตร์ 3 ระดับ — ชาติ · แม่บท · ปฏิบัติราชการ พร้อมการตรวจสอบความสอดคล้อง"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ยุทธศาสตร์ชาติ", count: national.length, level: "NATIONAL" },
          { label: "แผนแม่บท", count: master.length, level: "MASTER" },
          { label: "แผนปฏิบัติราชการ", count: action.length, level: "ACTION" },
        ].map((s) => {
          const meta = LEVEL_META[s.level as keyof typeof LEVEL_META];
          return (
            <div
              key={s.level}
              className="rounded-sm border border-slate-200 bg-white p-4"
            >
              <div
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${meta.color} mb-2`}
              >
                {meta.label}
              </div>
              <div className="text-2xl font-semibold text-slate-900 tabular-nums">
                {s.count}{" "}
                <span className="text-sm font-normal text-slate-500">แผน</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hierarchy */}
      <div className="rounded-sm border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
          ผังการถ่ายทอดเชิงน้ำตก (Cascading Hierarchy)
        </h2>

        <div className="space-y-3">
          {national.map((np) => (
            <PlanNode
              key={np.id}
              plan={np}
              childrenByParent={childrenByParent}
            />
          ))}
        </div>
      </div>

      {/* AI hint */}
      <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#b8860b] text-white">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              การตรวจสอบความสอดคล้องด้วย AI
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              ระบบใช้ Natural Language Processing วิเคราะห์ว่าแผนระดับล่าง
              "ตอบโจทย์" แผนระดับบนหรือไม่ — แจ้งเตือนหากพบช่องว่าง (gap)
              ในการถ่ายทอด พร้อมเสนอแนวทางปรับปรุง
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-[#b8860b] font-semibold uppercase tracking-wider">
              พร้อมพัฒนาใน Phase ถัดไป
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanNode({
  plan,
  childrenByParent,
}: {
  plan: Plan;
  childrenByParent: Map<string, Plan[]>;
}) {
  const childPlans = childrenByParent.get(plan.id) ?? [];
  const meta = LEVEL_META[plan.level as keyof typeof LEVEL_META];
  return (
    <div>
      <div
        className={`rounded-sm border border-slate-200 bg-white border-l-4 ${meta.accent} p-4`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${meta.color}`}
            >
              {meta.label}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {plan.code}
            </span>
          </div>
          {plan.startDate && plan.endDate && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="h-3 w-3" />
              {plan.startDate.getFullYear() + 543} —{" "}
              {plan.endDate.getFullYear() + 543}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          {plan.title}
        </h3>
        {plan.description && (
          <p className="text-xs text-slate-600 leading-relaxed">
            {plan.description}
          </p>
        )}
      </div>

      {childPlans.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
          {childPlans.map((child) => (
            <div key={child.id} className="flex">
              <div className="w-6 flex justify-center">
                <ArrowDown className="h-4 w-4 text-slate-300 mt-2" />
              </div>
              <div className="flex-1">
                <PlanNode
                  plan={child}
                  childrenByParent={childrenByParent}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
