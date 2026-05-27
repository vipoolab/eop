// Shared "คำสั่ง" document renderer — a true A4 page (210×297mm) with
// spacing measured from real RTP orders (สภ.บ้านหลวง ๓๐๓/๒๕๖๗ etc.):
//   • ตราครุฑ สูง ๓ ซม. (30mm) จัดกึ่งกลาง
//   • เว้นใต้ครุฑ ~5mm ก่อนหัวเรื่อง
//   • หัว: คำสั่ง<หน่วย> / ที่ X/Y / เรื่อง ... (กึ่งกลาง)
//   • เนื้อหา justified, ย่อหน้าแรกเยื้อง, line-height ~1.35
//   • TH SarabunPSK 16pt — ฟอนต์ราชการของจริง (self-hosted, SIPA)
//
// Used by: draft-step preview, review-step preview, and command detail page,
// so the format stays identical everywhere.

import { Garuda } from "@/components/garuda";
import type { CommandLetter } from "@/lib/commands/types";

const THAI_DIGIT = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
function toThai(s: string | number): string {
  return String(s)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGIT[Number(c)] : c))
    .join("");
}
function fmtSignedDate(iso: string, style: "abbreviated" | "full"): string {
  const d = new Date(iso);
  const day = toThai(d.getDate());
  const month = THAI_MONTHS[d.getMonth()];
  const year = toThai(d.getFullYear() + 543);
  return style === "full"
    ? `${day} เดือน ${month} พุทธศักราช ${year}`
    : `${day} ${month} พ.ศ. ${year}`;
}

interface Props {
  letter: CommandLetter;
  /** ISO date for "สั่ง ณ วันที่" — defaults to today */
  signedDate?: string;
  /** "draft" shows a "(ลายมือชื่อ)" placeholder; "final" shows applied signature */
  mode?: "draft" | "final";
}

// Common paragraph style — justified with first-line indent (~ย่อหน้า).
// textJustify "inter-character" distributes spacing across Thai characters (Thai has
// almost no inter-word spaces), avoiding the huge gaps plain "justify" creates — the
// CSS analogue of Word's thaiDistribute. Matches real ตร. คำสั่ง.
const P: React.CSSProperties = {
  textIndent: "2.5em",
  margin: "0 0 6pt 0",
  textAlign: "justify",
  textJustify: "inter-character",
};

export function CommandLetterDocument({ letter: L, signedDate, mode = "draft" }: Props) {
  const unitName = L.unitFullName ?? "สำนักงานตำรวจแห่งชาติ";
  const docNumber = L.docNumber ?? "...../๒๕๖๙";
  const subject = (L.subject ?? "").replace(/^\s*เรื่อง\s*/, "");
  const dateStyle = L.dateStyle ?? "abbreviated";
  const divider = L.dividerStyle ?? "none";
  const dateStr = fmtSignedDate(signedDate ?? new Date().toISOString(), dateStyle);

  return (
    <div className="overflow-x-auto flex justify-center bg-slate-100 dark:bg-slate-800 p-4 rounded-sm">
      {/* True A4 page */}
      <div
        className="bg-white text-slate-900 shadow-md shrink-0 font-[var(--font-sarabun)]"
        style={{
          width: "210mm",
          minHeight: "297mm",
          paddingTop: "13mm",
          paddingLeft: "30mm",
          paddingRight: "20mm",
          paddingBottom: "20mm",
          fontSize: "16pt",
          // line-height 1.15 ⇒ pitch ≈ 6.5mm, matching the measured ~6.47mm
          // of the real สภ.บ้านหลวง order (16pt single-ish spacing).
          lineHeight: 1.15,
        }}
      >
        {/* ── ตราครุฑ สูง ๓ ซม. (≈113px @96dpi) — กึ่งกลาง ── */}
        <div className="flex justify-center" style={{ marginBottom: "5mm" }}>
          <Garuda size={113} />
        </div>

        {/* ── หัวเรื่อง — กึ่งกลาง ── */}
        <div className="text-center" style={{ lineHeight: 1.25 }}>
          <div style={{ fontWeight: 600 }}>คำสั่ง{unitName}</div>
          <div>ที่ {docNumber}</div>
          <div style={{ padding: "0 8mm" }}>
            เรื่อง {subject}
            {L.subjectSuffix ? ` ${L.subjectSuffix}` : ""}
          </div>
        </div>

        {/* ── เส้นคั่น ── */}
        {divider === "asterisks" && (
          <div className="text-center" style={{ letterSpacing: "0.15em", margin: "2mm 0" }}>
            **********************************
          </div>
        )}
        {divider === "underline" && (
          <div className="flex justify-center" style={{ margin: "3mm 0" }}>
            <div style={{ borderTop: "1px solid #334155", width: "60%" }} />
          </div>
        )}
        {divider === "none" && <div style={{ height: "5mm" }} />}

        {/* ── เนื้อหา ── */}
        {L.objective && <p style={P}>{L.objective}</p>}
        {L.legalBasis && <p style={P}>{L.legalBasis}</p>}
        {/* Backward-compat: legacy single-block body */}
        {!L.objective && !L.legalBasis && L.introduction && <p style={P}>{L.introduction}</p>}

        {(L.directives ?? []).map((d, i) => (
          <p key={i} style={P}>
            {d}
          </p>
        ))}

        {L.isAmendment && <p style={P}>นอกนั้นให้เป็นไปตามคำสั่งเดิมทุกประการ</p>}
        {L.effectiveClause && <p style={P}>{L.effectiveClause}</p>}
        {!L.effectiveClause && L.closing && <p style={P}>{L.closing}</p>}

        {/* ── สั่ง ณ วันที่ — กึ่งกลาง ── */}
        <div className="text-center" style={{ marginTop: "10mm" }}>
          สั่ง ณ วันที่ {dateStr}
        </div>

        {/* ── ลายมือชื่อ — กึ่งกลาง ── */}
        <div className="text-center" style={{ marginTop: "8mm", lineHeight: 1.4 }}>
          {mode === "final" && L.signatureApplied ? (
            <>
              <div style={{ fontStyle: "italic", color: "#1e3a5f", fontSize: "18pt" }}>
                ✒ {L.signatureText}
              </div>
              {L.signerRank && <div>{L.signerRank}</div>}
              <div>({L.signerName})</div>
              <div style={{ fontSize: "14pt" }}>{L.signerTitle}</div>
            </>
          ) : (
            <>
              <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "14pt" }}>
                (ลายมือชื่อ)
              </div>
              {L.signerRank && <div>{L.signerRank}</div>}
              <div>({L.signerName ?? "ชื่อ-นามสกุลผู้สั่งการ"})</div>
              <div>{L.signerTitle ?? "ตำแหน่งผู้สั่งการ"}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
