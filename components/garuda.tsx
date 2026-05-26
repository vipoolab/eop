// Garuda emblem — simplified silhouette used as ตราครุฑ on official letters.
// Per ระเบียบสารบรรณ พ.ศ. ๒๕๒๖ ข้อ ๑๓.๑.๑ ขนาด ๑.๕ x ๑.๕ ซม. (≈ 57 px @ 96 dpi)
// or 3 x 3 cm (≈ 113 px) for the document head version.
//
// This is a stylised representation drawn as SVG — not the official emblem image.
// For production printing, replace with the official ครุฑ image asset.

interface Props {
  size?: number;
  className?: string;
}

export function Garuda({ size = 64, className = "" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="ตราครุฑ — สัญลักษณ์ของหน่วยราชการไทย"
      role="img"
    >
      {/* Body */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="0.5">
        {/* Head + crown */}
        <path d="M32 4 L29 7 L30 10 L32 9 L34 10 L35 7 Z" />
        <circle cx="32" cy="13" r="3" />
        {/* Beak */}
        <path d="M32 14 L30 17 L32 18 L34 17 Z" />
        {/* Neck */}
        <path d="M30 16 L29 22 L35 22 L34 16 Z" />
        {/* Wings — spread outward */}
        <path d="M29 22 L14 24 L8 32 L12 30 L16 32 L20 30 L24 32 L28 28 Z" />
        <path d="M35 22 L50 24 L56 32 L52 30 L48 32 L44 30 L40 32 L36 28 Z" />
        {/* Inner wing details */}
        <path d="M22 26 L18 30 L22 28 Z" opacity="0.6" />
        <path d="M42 26 L46 30 L42 28 Z" opacity="0.6" />
        {/* Body */}
        <path d="M28 28 L26 40 L32 44 L38 40 L36 28 Z" />
        {/* Arms holding (symbolic) */}
        <path d="M26 32 L20 36 L22 38 L28 36 Z" />
        <path d="M38 32 L44 36 L42 38 L36 36 Z" />
        {/* Legs */}
        <path d="M30 42 L28 50 L30 52 L32 48 L34 52 L36 50 L34 42 Z" />
        {/* Tail feathers */}
        <path d="M28 50 L24 58 L26 58 L28 54 Z" />
        <path d="M32 50 L31 60 L33 60 L32 54 Z" />
        <path d="M36 50 L40 58 L38 58 L36 54 Z" />
      </g>
    </svg>
  );
}
