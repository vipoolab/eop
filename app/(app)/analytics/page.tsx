// /analytics — Hub: วิเคราะห์ + พยากรณ์ (TOR 6.2, 6.3)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { BrainCircuit, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function AnalyticsHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/");

  const [predictiveCount, anomalyOpen, anomalyCritical] = await Promise.all([
    prisma.predictionResult.count(),
    prisma.anomalyAlert.count({ where: { resolved: false } }),
    prisma.anomalyAlert.count({
      where: { resolved: false, severity: { in: ["HIGH", "CRITICAL"] } },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={BrainCircuit}
        eyebrow="Data & AI · Analytics"
        title="วิเคราะห์ + พยากรณ์"
        description="AI พยากรณ์พื้นที่/เวลาเสี่ยง + ตรวจจับความผิดปกติของระบบและข้อมูล"
        live
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/ai/predictive"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-violet-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                Predictive Analytics
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">TOR 6.3 / 8.10.4</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            AI พยากรณ์ <strong>พื้นที่เสี่ยง / ช่วงเวลาเสี่ยง</strong> 7 วันข้างหน้า เพื่อจัดกำลังเชิงรุก
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              พยากรณ์ <strong className="text-slate-800">{predictiveCount}</strong> รายการ
            </span>
            <span className="text-violet-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              เปิด <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        <Link
          href="/analytics/anomaly"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-rose-400 hover:shadow-lg transition-all relative"
        >
          {anomalyCritical > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              {anomalyCritical}
            </span>
          )}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">Anomaly Alerts</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">TOR 6.2</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            ตรวจจับ <strong>ความผิดปกติของระบบหรือข้อมูล</strong> ที่ส่งเข้าระบบ
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              เปิดอยู่ <strong className="text-slate-800">{anomalyOpen}</strong> /
              ขั้น High+ <strong className="text-rose-700">{anomalyCritical}</strong>
            </span>
            <span className="text-rose-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              ดูทั้งหมด <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
