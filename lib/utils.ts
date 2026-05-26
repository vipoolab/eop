import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatThaiNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

export function formatThaiDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

// ─────────────────────────────────────────────
// Upload limits (Vercel Hobby plan caps request body at 4.5 MB)
// ─────────────────────────────────────────────

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB — leave 0.5 MB headroom

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Parse a fetch Response as JSON, but degrade gracefully when the server
 * returns plain text or HTML (e.g. Vercel's 413 "Request Entity Too Large").
 *
 * Returns either the parsed body or a `{ success: false, message }` shape so
 * callers can treat both paths uniformly.
 */
export async function safeJson(
  res: Response
): Promise<{ success: boolean; message?: string; data?: unknown } & Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Common non-JSON cases
    if (res.status === 413 || /request en[a-z ]*too large/i.test(text)) {
      return {
        success: false,
        message: `ไฟล์ใหญ่เกินขนาดที่ระบบรองรับ (สูงสุด ${formatBytes(MAX_UPLOAD_BYTES)} ต่อครั้ง) — กรุณาแยกไฟล์ส่งทีละน้อย`,
      };
    }
    if (res.status === 504 || /timeout|timed out/i.test(text)) {
      return {
        success: false,
        message: "AI ประมวลผลนานเกินกำหนด (สูงสุด ๖๐ วินาที) — กรุณาลดขนาด/จำนวนไฟล์",
      };
    }
    return {
      success: false,
      message: `เซิร์ฟเวอร์ตอบไม่ใช่ JSON (HTTP ${res.status}) — ${text.slice(0, 120)}`,
    };
  }
}
