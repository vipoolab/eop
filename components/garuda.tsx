// Garuda emblem — used as ตราครุฑ on official letters.
// Per ระเบียบสารบรรณ ข้อ ๑๓.๑.๑ ขนาด ๑.๕ x ๑.๕ ซม. (≈ 57 px @ 96 dpi).
//
// The image asset (public/garuda.png) was extracted from a real RTP
// คำสั่ง (ตร. ที่ ๔๑๙/๒๕๕๖) so the design matches actual government
// documents, not a stylised approximation.

import Image from "next/image";

interface Props {
  /** Display height in px. Width auto-calculates to preserve aspect ratio. */
  size?: number;
  className?: string;
}

export function Garuda({ size = 64, className = "" }: Props) {
  // Source PNG (extracted from คำสั่ง ตร. สภ.บ้านหลวง) is ~396:400 ≈ 1:1.
  const width = Math.round(size * (396 / 400));
  return (
    <Image
      src="/garuda.png"
      alt="ตราครุฑ — สัญลักษณ์ของหน่วยราชการไทย"
      width={width}
      height={size}
      className={className}
      priority
      unoptimized
    />
  );
}
