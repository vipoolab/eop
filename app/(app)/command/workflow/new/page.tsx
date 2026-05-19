// New Command Page — TOR 5.4.4
// Server component: loads units + missions for the form

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TorBanner } from "@/components/tor-banner";
import { NewCommandForm } from "./new-command-form";
import { ArrowLeft } from "lucide-react";

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
      <TorBanner
        torRefs={["5.4.4", "4.1", "4.5"]}
        system="ระบบ 4: Command & Operation"
        description="สร้างคำสั่งใหม่ — ระบุเนื้อหา + หน่วยรับ + ลำดับความสำคัญ (สถานะเริ่มต้น: ร่าง)"
      />

      <Link
        href="/command/workflow"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปยัง Kanban
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          สร้างคำสั่งใหม่
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          ระบบจะสร้างเลขที่เอกสารอัตโนมัติ (ตร ๐๐๐๑.๖๙/xxxx)
        </p>

        <NewCommandForm units={units} missions={missions} />
      </div>
    </div>
  );
}
