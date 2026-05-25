// /commands/new — multi-step wizard

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, FileEdit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CommandWizard } from "./command-wizard";

export const dynamic = "force-dynamic";

export default function NewCommandPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/commands"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ รายการคำสั่ง
      </Link>

      <PageHeader
        icon={FileEdit}
        eyebrow="ร่างหนังสือสั่งการ"
        title="ร่างหนังสือสั่งการใหม่"
        description="ใส่เจตนาที่ต้องการ AI จะร่างหนังสือราชการให้ พร้อมจับคู่กับยุทธศาสตร์ ๓ ระดับ"
        live
      />

      <Suspense fallback={<div className="text-sm text-slate-500">กำลังโหลด...</div>}>
        <CommandWizard />
      </Suspense>
    </div>
  );
}
