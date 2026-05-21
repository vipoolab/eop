// /ai/documents — Hub: AI Document Tools (TOR 8.10.3)
// รวม OCR + Document Classification ในที่เดียว — เข้าใจง่าย เลือกเครื่องมือ

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  FileSearch,
  ScanText,
  FolderTree,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [ocrCount, classifyCount] = await Promise.all([
    prisma.ocrJob.count(),
    prisma.documentClassification.count(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={FileSearch}
        eyebrow="Data & AI · Document Tools"
        title="เครื่องมือเอกสาร AI"
        description="อัปโหลดเอกสาร → AI ช่วยอ่าน + จัดหมวด + แนะนำการจัดเก็บ"
        live
      />

      {/* 2 main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OCR Card */}
        <Link
          href="/ai/ocr"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-4 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ScanText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                อ่านเอกสารด้วย AI (OCR)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">TOR 8.10.3</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            อัปโหลด PDF (≤ 5 หน้า) หรือรูป → AI อ่านภาษาไทย → แสดงเทียบกับต้นฉบับ +{" "}
            <strong>แก้ไขข้อความที่อ่านได้</strong>
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              ประวัติ <strong className="text-slate-800">{ocrCount}</strong> ครั้ง
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold group-hover:translate-x-1 transition-transform">
              เปิดเครื่องมือ <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Classification Card */}
        <Link
          href="/ai/doc-classification"
          className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-violet-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-4 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <FolderTree className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                จัดหมวดเอกสาร AI
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">TOR 6.2</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            อัปโหลดเอกสาร → AI จัดหมวด 6 ประเภท (ยศ./ผบ./มค./มข./วจ./อจ.) +
            แนะนำหน่วยงานเจ้าของ
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              จัดหมวดแล้ว{" "}
              <strong className="text-slate-800">{classifyCount}</strong> ครั้ง
            </span>
            <span className="inline-flex items-center gap-1 text-violet-700 font-semibold group-hover:translate-x-1 transition-transform">
              เปิดเครื่องมือ <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-600 leading-relaxed">
        <strong className="text-slate-700 block mb-1">เกี่ยวกับเครื่องมือนี้</strong>
        ขับเคลื่อนด้วย Anthropic Claude Opus 4.5 — รองรับไฟล์
        <code className="mx-1 px-1.5 py-0.5 rounded bg-white border text-[10px]">
          .PDF
        </code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-white border text-[10px]">
          .DOCX
        </code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-white border text-[10px]">
          .XLSX
        </code>
        <code className="mx-1 px-1.5 py-0.5 rounded bg-white border text-[10px]">
          .JPG/.PNG
        </code>
        ตามมาตรฐาน TOR 8.10.3(4)
      </div>
    </div>
  );
}
