"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileLock, Download } from "lucide-react";

interface ConsentRow {
  id: string;
  consentType: string;
  granted: boolean;
  version: string;
  grantedAt: Date | string | null;
  revokedAt: Date | string | null;
}

const CONSENT_LABEL: Record<string, string> = {
  PERSONAL_DATA: "ข้อมูลส่วนบุคคล (PDPA)",
  LOCATION: "ข้อมูลตำแหน่ง",
  BIOMETRIC: "ข้อมูลชีวภาพ (ใบหน้า/ลายนิ้วมือ)",
  ANALYTICS: "ข้อมูลการใช้งานเพื่อ Analytics",
};

const ALL_TYPES: Array<keyof typeof CONSENT_LABEL> = [
  "PERSONAL_DATA",
  "LOCATION",
  "BIOMETRIC",
  "ANALYTICS",
];

export function ConsentSection({ consents }: { consents: ConsentRow[] }) {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  function findConsent(type: string) {
    return consents.find((c) => c.consentType === type);
  }

  async function toggle(type: string, granted: boolean) {
    setLoadingType(type);
    try {
      const res = await fetch("/api/security/my-account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentType: type, granted }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "เปลี่ยน consent ไม่สำเร็จ");
    } finally {
      setLoadingType(null);
    }
  }

  async function downloadMyData() {
    try {
      const res = await fetch("/api/security/my-account/export");
      if (!res.ok) throw new Error("Export ล้มเหลว");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "eop-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-2">
      {ALL_TYPES.map((type) => {
        const c = findConsent(type);
        const granted = c?.granted ?? false;
        return (
          <div
            key={type}
            className="rounded-md border border-slate-200 bg-slate-50/40 p-3 flex items-center gap-3"
          >
            <FileLock className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-800">{CONSENT_LABEL[type]}</div>
              <div className="text-[10px] text-slate-500">
                {c
                  ? granted
                    ? `ยินยอม v${c.version} เมื่อ ${c.grantedAt ? new Date(c.grantedAt).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "—"}`
                    : `ถอนความยินยอมเมื่อ ${c.revokedAt ? new Date(c.revokedAt).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "—"}`
                  : "ยังไม่ได้ระบุ"}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={granted}
                onChange={(e) => toggle(type, e.target.checked)}
                disabled={loadingType === type}
                className="h-4 w-4"
              />
              <span className="text-xs text-slate-600">
                {loadingType === type ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : granted ? (
                  "ยินยอม"
                ) : (
                  "ไม่ยินยอม"
                )}
              </span>
            </label>
          </div>
        );
      })}
      <button
        onClick={downloadMyData}
        className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white text-blue-700 px-3 py-1.5 text-xs hover:bg-blue-50 mt-2"
      >
        <Download className="h-3 w-3" />
        ดาวน์โหลดข้อมูลส่วนตัวของฉัน (สิทธิ์ตาม PDPA)
      </button>
    </div>
  );
}
