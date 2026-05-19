// New Command Page — TOR 5.4.4
// Server component: loads units + missions for the form

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { NewCommandForm } from "./new-command-form";
import { ArrowLeft, FilePlus2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewCommandPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(role)) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-bold text-rose-900">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-rose-700 mt-1">
          เฉพาะ ADMIN / COMMANDER / STAFF เท่านั้นที่สร้างคำสั่งได้
        </p>
      </div>
    );
  }

  const [units, missions] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.mission.findMany({
      where: { status: "active" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/command/workflow"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปยัง Kanban
      </Link>

      <PageHeader
        icon={FilePlus2}
        eyebrow="New Command"
        title="สร้างคำสั่งใหม่"
        description="ระบุเนื้อหาคำสั่ง · หน่วยรับ · ลำดับความสำคัญ — ระบบจะสร้างเลขที่เอกสารอัตโนมัติ"
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewCommandForm units={units} missions={missions} />
      </div>
    </div>
  );
}
