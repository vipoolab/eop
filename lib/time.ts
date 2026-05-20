// Shared time utilities

/**
 * Returns "เมื่อสักครู่" / "5 นาทีที่แล้ว" / "2 ชั่วโมงที่แล้ว" / "3 วันที่แล้ว" / date
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  return d.toLocaleDateString("th-TH");
}

/**
 * Format Thai short date+time
 */
export function formatThaiDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
