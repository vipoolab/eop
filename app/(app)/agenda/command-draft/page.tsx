// AI Command Drafting — TOR 5.4.2 PoC #1 (5 คะแนน)
// Server component shell + client form

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TorBanner } from "@/components/tor-banner";
import { CommandDraftForm } from "./draft-form";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommandDraftPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <TorBanner
        torRefs={["5.4.2", "2.2"]}
        system="ระบบ 2: Agenda-based Module"
        description="Generative AI ช่วยร่างหนังสือสั่งการจาก 5 keywords"
        pocNumber={1}
        live
      />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            AI ช่วยร่างหนังสือสั่งการ
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ระบุข้อมูล 5 ช่อง → Claude AI ร่างเนื้อหาภาษาราชการให้
            (PoC ข้อ 1 — TOR 5 คะแนน)
          </p>
        </div>
      </div>

      <CommandDraftForm />
    </div>
  );
}
