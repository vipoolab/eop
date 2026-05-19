// AI Command Drafting — TOR 5.4.2 PoC #1 (5 คะแนน)
// Server component shell + client form

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { CommandDraftForm } from "./draft-form";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommandDraftPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={Sparkles}
        eyebrow="Agenda · AI Draft"
        title="AI ช่วยร่างหนังสือสั่งการ"
        description="ระบุข้อมูล 5 ช่อง — AI จะร่างเนื้อหาภาษาราชการให้อัตโนมัติ"
        live
      />

      <CommandDraftForm />
    </div>
  );
}
