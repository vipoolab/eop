// Intelligent Search — TOR 8.10.12
// 4 modes: Basic / Advanced / Full-text / Semantic (AI)

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SearchUI } from "./search-ui";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={Search}
        eyebrow="Data & AI · Intelligent Search"
        title="ค้นหาเอกสารและคำสั่ง"
        description="4 โหมดค้นหา — พื้นฐาน · ขั้นสูง · Full-text · AI Semantic Search"
        live
      />

      <SearchUI />
    </div>
  );
}
