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
// Upload limits
// On Railway (current host) there's no small request-body cap like Vercel
// Hobby's 4.5 MB. The real ceiling is the Anthropic API: PDFs up to 32 MB,
// images up to ~5 MB. base64 inflates ~33%, so we cap a single file at
// 20 MB (→ ~27 MB encoded, safely under 32 MB).
// ─────────────────────────────────────────────

/** Max size per single uploaded file (classify single / OCR / each batch file) */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
/** Max combined size for a batch upload (multiple files in one request) */
export const MAX_BATCH_BYTES = 50 * 1024 * 1024; // 50 MB total

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
