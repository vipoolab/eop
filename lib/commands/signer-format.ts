// Expand abbreviated Thai police ranks and positions to their full forms for
// formal documents (matches ตร. ๔๑๙/๒๕๕๖ which uses "พลตำรวจเอก" /
// "ผู้บัญชาการตำรวจแห่งชาติ" — never the abbreviations).
//
// Persona data stores the short forms (พล.ต.อ., ผบ.ตร.) because the UI shows
// them everywhere, but a printed คำสั่ง MUST use the long forms.

// Longest-match first matters when stripping a rank from the start of a name.
const RANK_EXPANSIONS: Array<readonly [string, string]> = [
  ["พล.ต.อ.", "พลตำรวจเอก"],
  ["พล.ต.ท.", "พลตำรวจโท"],
  ["พล.ต.ต.", "พลตำรวจตรี"],
  ["พ.ต.อ.", "พันตำรวจเอก"],
  ["พ.ต.ท.", "พันตำรวจโท"],
  ["พ.ต.ต.", "พันตำรวจตรี"],
  ["ร.ต.อ.", "ร้อยตำรวจเอก"],
  ["ร.ต.ท.", "ร้อยตำรวจโท"],
  ["ร.ต.ต.", "ร้อยตำรวจตรี"],
  ["ด.ต.", "ดาบตำรวจ"],
  ["จ.ส.ต.", "จ่าสิบตำรวจ"],
  ["ส.ต.อ.", "สิบตำรวจเอก"],
  ["ส.ต.ท.", "สิบตำรวจโท"],
  ["ส.ต.ต.", "สิบตำรวจตรี"],
];

// "รอง ..." variants are matched first so they don't get truncated.
const TITLE_EXPANSIONS: Array<readonly [string, string]> = [
  ["รอง ผบ.ตร.", "รองผู้บัญชาการตำรวจแห่งชาติ"],
  ["ผู้ช่วย ผบ.ตร.", "ผู้ช่วยผู้บัญชาการตำรวจแห่งชาติ"],
  ["ผบ.ตร.", "ผู้บัญชาการตำรวจแห่งชาติ"],
  ["รอง จตร.", "รองจเรตำรวจแห่งชาติ"],
  ["จตร.", "จเรตำรวจแห่งชาติ"],
  ["รอง ผบช.", "รองผู้บัญชาการ"],
  ["ผบช.", "ผู้บัญชาการ"],
  ["รอง ผบก.", "รองผู้บังคับการ"],
  ["ผบก.", "ผู้บังคับการ"],
  ["รอง ผกก.", "รองผู้กำกับการ"],
  ["ผกก.", "ผู้กำกับการ"],
  ["สวญ.", "สารวัตรใหญ่"],
  ["รอง สว.", "รองสารวัตร"],
  ["สว.", "สารวัตร"],
];

export function expandRank(rank?: string): string | undefined {
  if (!rank) return rank;
  const t = rank.trim();
  for (const [abbr, full] of RANK_EXPANSIONS) if (t === abbr) return full;
  return t;
}

export function expandTitle(title?: string): string | undefined {
  if (!title) return title;
  const t = title.trim();
  for (const [abbr, full] of TITLE_EXPANSIONS) if (t === abbr) return full;
  return t;
}

/**
 * Strip a leading rank abbreviation (e.g. "พล.ต.อ. กฤษฎา ..." → "กฤษฎา ...")
 * so the (name) line in the signature block doesn't repeat the rank above it.
 */
export function stripRankFromName(name?: string): string | undefined {
  if (!name) return name;
  let n = name.trim();
  for (const [abbr] of RANK_EXPANSIONS) {
    if (n.startsWith(abbr)) {
      n = n.slice(abbr.length).trim();
      break;
    }
  }
  return n;
}
