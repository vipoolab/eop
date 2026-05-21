// /command/incident/new — สร้างเหตุการณ์ใหม่

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AlertOctagon, ArrowLeft } from "lucide-react";
import { NewIncidentForm } from "./new-form";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function NewIncidentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(role)) redirect("/command/incident");

  const [units, missions] = await Promise.all([
    prisma.unit.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.mission.findMany({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
      select: { id: true, code: true, title: true },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/command/incident"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายการ
      </Link>

      <PageHeader
        icon={AlertOctagon}
        eyebrow="Command & Operation · Incident"
        title="สร้างเหตุการณ์ใหม่"
        description="บันทึกเหตุการณ์ — กำหนดประเภท · ระดับความรุนแรง · พื้นที่ · มอบหมายหน่วยรับ"
      />

      <NewIncidentForm units={units} missions={missions} />
    </div>
  );
}
