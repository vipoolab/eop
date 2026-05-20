// Dynamic Form Builder — TOR 2.3.1 No-Code · Drag & Drop

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { FormBuilder } from "./form-builder";
import { FormInput } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FormBuilderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={FormInput}
        eyebrow="Agenda-based · Form Builder"
        title="Dynamic Form Builder"
        description="สร้างแบบฟอร์มราชการแบบ No-Code · ลากฟิลด์เพื่อจัดเรียง · ใช้งานได้ทันที"
      />

      <FormBuilder />
    </div>
  );
}
