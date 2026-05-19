// AI Document Classification — TOR 5.4.6 PoC #2

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ClassifyForm } from "./classify-form";
import { FolderTree } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocClassificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={FolderTree}
        eyebrow="Data & AI · Document Classification"
        title="AI จำแนกเอกสาร"
        description="อัปโหลดเอกสาร (DOCX / XLSX / PDF / JPG / PNG / TXT) → AI จะจำแนกหน่วยงานเจ้าของเรื่องอัตโนมัติ"
        live
      />

      <ClassifyForm />
    </div>
  );
}
