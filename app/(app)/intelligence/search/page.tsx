// /intelligence/search — Intelligent search across all systems

import Link from "next/link";
import { Search, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInterface } from "./search-interface";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        eyebrow="ระบบ AI"
        title="ค้นหาอัจฉริยะ (Intelligent Search)"
        description="ค้นหาข้ามระบบ — เอกสาร / หนังสือสั่งการ / เหตุการณ์ / แบบประเมิน ด้วย ๔ โหมด: ทั่วไป, ขั้นสูง, เต็มข้อความ, เชิงความหมาย"
        live
        actions={
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      <SearchInterface />
    </div>
  );
}
