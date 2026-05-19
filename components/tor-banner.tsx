import { FileText } from "lucide-react";

interface TorBannerProps {
  /** เลขข้อ TOR ที่หน้านี้ตอบ (เช่น "5.4.1" หรือ ["5.4.4", "4.1"]) */
  torRefs: string | string[];
  /** ชื่อระบบ/หมวด (เช่น "ระบบ 4: Command & Operation") */
  system?: string;
  /** คำอธิบายสั้นๆ ว่าหน้านี้ทำอะไร */
  description: string;
  /** ระบุว่าหน้านี้คือ PoC ฟีเจอร์ที่เท่าไหร่ (1-4) */
  pocNumber?: 1 | 2 | 3 | 4;
  /** ระบุว่ามี Live AI working ในหน้านี้ */
  live?: boolean;
}

/**
 * Banner ที่แสดง TOR clause references ทุกหน้า
 * เพื่อให้กรรมการ/dev อ่านเข้าใจทันทีว่าหน้านี้ตอบ TOR ข้อไหน
 */
export function TorBanner({
  torRefs,
  system,
  description,
  pocNumber,
  live,
}: TorBannerProps) {
  const refs = Array.isArray(torRefs) ? torRefs : [torRefs];

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <FileText className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {system && (
              <span className="text-xs font-semibold text-blue-900">
                {system}
              </span>
            )}

            {refs.map((ref) => (
              <span
                key={ref}
                className="inline-flex items-center rounded-md bg-white border border-blue-300 px-2 py-0.5 text-[11px] font-mono font-medium text-blue-700"
              >
                TOR {ref}
              </span>
            ))}

            {pocNumber && (
              <span className="inline-flex items-center rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                ⭐ PoC {pocNumber}
              </span>
            )}

            {live && (
              <span className="inline-flex items-center gap-1 rounded-md bg-green-100 border border-green-300 px-2 py-0.5 text-[11px] font-medium text-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                Live AI
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-snug">{description}</p>
        </div>
      </div>
    </div>
  );
}
