// 4-mode search across all systems
//   BASIC    — substring match in title only
//   ADVANCED — title + tags + filters (type, date range, unit)
//   FULLTEXT — title + extractedText + description across all entities
//   SEMANTIC — keyword match + synonym expansion (mock thesaurus)

import type {
  SearchResult,
  SearchFilters,
  SearchMode,
  SearchResultType,
} from "./types";
import { listDocuments, listIncidents } from "./store";
import { listCommands } from "@/lib/commands/store";
import { listAssessments } from "@/lib/assessments/store";

// ── Mock thesaurus for SEMANTIC mode ───────────
// Maps a query term → list of expanded/related Thai/English synonyms
const THESAURUS: Record<string, string[]> = {
  ยาเสพติด: ["ยาบ้า", "ไอซ์", "เฮโรอีน", "กัญชา", "ยาเสพ", "drug"],
  ยาบ้า: ["ยาเสพติด", "เมทแอมเฟตามีน", "ICE"],
  ฉ้อโกง: ["หลอกลวง", "ต้มตุ๋น", "scam", "ฉ้อโกงออนไลน์", "หลอก"],
  scam: ["ฉ้อโกง", "หลอกลวง", "ต้มตุ๋น", "คอลเซ็นเตอร์", "หลอกลงทุน"],
  ก่อการร้าย: ["ภัยคุกคาม", "ระเบิด", "วินาศกรรม", "ความมั่นคง"],
  อาชญากรรม: ["คดี", "อาชญากร", "อาชญากรรมไซเบอร์", "ผู้ต้องหา"],
  ออนไลน์: ["ไซเบอร์", "อินเทอร์เน็ต", "ดิจิทัล", "cyber", "online"],
  จราจร: ["อุบัติเหตุ", "การจราจร", "ขับรถ", "ถนน", "ทางหลวง"],
  อุบัติเหตุ: ["จราจร", "ชน", "บาดเจ็บ", "เสียชีวิต", "ทางหลวง"],
  ชายแดน: ["ชายแดน", "ตชด.", "ตรวจคนเข้าเมือง", "ลาว", "พม่า", "กัมพูชา"],
  ชุมนุม: ["ก่อความวุ่นวาย", "ประท้วง", "การเมือง", "ผู้ชุมนุม", "ม็อบ"],
  ลักทรัพย์: ["ขโมย", "โจรกรรม", "ลัก", "หาย"],
  Songkran: ["สงกรานต์", "เทศกาล", "เมษายน", "อุบัติเหตุ"],
  สงกรานต์: ["Songkran", "เทศกาล", "เมษายน"],
  ยุทธศาสตร์: ["แผน", "ยุทธศาสตร์ชาติ", "แผนแม่บท", "20 ปี"],
  แผนยุทธศาสตร์: ["ยุทธศาสตร์", "แผนแม่บท", "แผนปฏิบัติราชการ", "ยุทธศาสตร์ชาติ"],
  ความมั่นคง: ["ก่อการร้าย", "ภัยคุกคาม", "ข่าวกรอง", "ชายแดน"],
  ภัยพิบัติ: ["เหตุฉุกเฉิน", "อุทกภัย", "วาตภัย", "แผ่นดินไหว"],
  ผู้บริหาร: ["ผู้บัญชาการ", "ผบก.", "ผบช.", "ผู้สั่งการ", "executive"],
  KPI: ["ตัวชี้วัด", "เป้าหมาย", "ผลการดำเนินงาน"],
};

function expandSemantic(query: string): string[] {
  const lower = query.toLowerCase();
  const terms = new Set<string>([query]);
  for (const [key, syns] of Object.entries(THESAURUS)) {
    if (lower.includes(key.toLowerCase())) {
      for (const s of syns) terms.add(s);
    }
  }
  // Also split query into tokens (Thai is space-separated for most cases)
  for (const tok of query.split(/\s+/).filter(Boolean)) {
    terms.add(tok);
  }
  return Array.from(terms);
}

// ── Helpers ────────────────────────────────────

function includesAny(text: string, terms: string[]): { match: boolean; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const t of terms) {
    if (!t) continue;
    if (lower.includes(t.toLowerCase())) matched.push(t);
  }
  return { match: matched.length > 0, matched };
}

function scoreOf(
  text: string,
  terms: string[],
  weight = 1
): number {
  const lower = text.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!t) continue;
    const occurrences = lower.split(t.toLowerCase()).length - 1;
    s += occurrences * weight;
  }
  return s;
}

function snippet(text: string, terms: string[], length = 180): string {
  const lower = text.toLowerCase();
  for (const t of terms) {
    const idx = lower.indexOf(t.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + length - 40);
      const prefix = start > 0 ? "…" : "";
      const suffix = end < text.length ? "…" : "";
      return prefix + text.slice(start, end) + suffix;
    }
  }
  return text.slice(0, length) + (text.length > length ? "…" : "");
}

// ── Search functions ───────────────────────────

interface SearchInput {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
}

export function search({ query, mode, filters }: SearchInput): SearchResult[] {
  if (!query.trim()) return [];

  let terms: string[];
  switch (mode) {
    case "SEMANTIC":
      terms = expandSemantic(query);
      break;
    case "BASIC":
    case "ADVANCED":
    case "FULLTEXT":
    default:
      terms = [query];
      // Also break Thai whitespace-separated tokens
      for (const t of query.split(/\s+/).filter(Boolean)) {
        if (!terms.includes(t)) terms.push(t);
      }
      break;
  }

  const results: SearchResult[] = [];

  // ── 1. Documents ──
  const docs = listDocuments();
  for (const d of docs) {
    let scoreT = 0;
    const matched = new Set<string>();
    // Title is high-weight
    const titleM = includesAny(d.title, terms);
    if (titleM.match) {
      scoreT += scoreOf(d.title, terms, 5);
      titleM.matched.forEach((m) => matched.add(m));
    }
    // Tags (ADVANCED+)
    if (mode !== "BASIC") {
      const tagText = d.tags.join(" ");
      const tagM = includesAny(tagText, terms);
      if (tagM.match) {
        scoreT += scoreOf(tagText, terms, 3);
        tagM.matched.forEach((m) => matched.add(m));
      }
    }
    // Full extracted text (FULLTEXT + SEMANTIC)
    if (mode === "FULLTEXT" || mode === "SEMANTIC") {
      const txtM = includesAny(d.extractedText, terms);
      if (txtM.match) {
        scoreT += scoreOf(d.extractedText, terms, 1);
        txtM.matched.forEach((m) => matched.add(m));
      }
    }
    if (scoreT > 0) {
      results.push({
        id: `doc-${d.id}`,
        type: "document",
        title: d.title,
        snippet: snippet(d.extractedText, Array.from(matched)),
        href: `/intelligence?doc=${d.id}`,
        score: Math.min(1, scoreT / 20),
        matchedTerms: Array.from(matched),
      });
    }
  }

  // ── 2. Incidents ──
  const incidents = listIncidents();
  for (const inc of incidents) {
    let scoreT = 0;
    const matched = new Set<string>();
    // Title-like = description (always searched)
    const descM = includesAny(inc.description, terms);
    if (descM.match) {
      scoreT += scoreOf(inc.description, terms, mode === "BASIC" ? 5 : 3);
      descM.matched.forEach((m) => matched.add(m));
    }
    // Type/address for ADVANCED+
    if (mode !== "BASIC") {
      const meta = `${inc.type} ${inc.location.province} ${inc.location.district} ${inc.location.address}`;
      const m = includesAny(meta, terms);
      if (m.match) {
        scoreT += scoreOf(meta, terms, 2);
        m.matched.forEach((mm) => matched.add(mm));
      }
    }
    if (scoreT > 0) {
      results.push({
        id: `inc-${inc.id}`,
        type: "incident",
        title: `[${inc.type}] ${inc.description.slice(0, 60)}`,
        snippet: `${inc.location.province} • ${inc.location.district} • ${new Date(inc.occurredAt).toLocaleString("th-TH")} • แหล่ง: ${inc.source}`,
        href: `/intelligence/heatmap?incident=${inc.id}`,
        score: Math.min(1, scoreT / 15),
        matchedTerms: Array.from(matched),
      });
    }
  }

  // ── 3. Commands ──
  const commands = listCommands();
  for (const c of commands) {
    let scoreT = 0;
    const matched = new Set<string>();
    const titleM = includesAny(c.letter.subject, terms);
    if (titleM.match) {
      scoreT += scoreOf(c.letter.subject, terms, 5);
      titleM.matched.forEach((m) => matched.add(m));
    }
    if (mode !== "BASIC") {
      const intentM = includesAny(c.userIntent || "", terms);
      if (intentM.match) {
        scoreT += scoreOf(c.userIntent || "", terms, 3);
        intentM.matched.forEach((m) => matched.add(m));
      }
    }
    if (mode === "FULLTEXT" || mode === "SEMANTIC") {
      const body = [
        c.letter.introduction,
        ...(c.letter.directives ?? []),
        c.letter.closing,
      ]
        .filter(Boolean)
        .join(" ");
      const bodyM = includesAny(body, terms);
      if (bodyM.match) {
        scoreT += scoreOf(body, terms, 1);
        bodyM.matched.forEach((m) => matched.add(m));
      }
    }
    if (scoreT > 0) {
      results.push({
        id: `cmd-${c.id}`,
        type: "command",
        title: c.letter.subject,
        snippet: snippet(
          c.letter.introduction || c.userIntent || "",
          Array.from(matched)
        ),
        href: `/commands/${c.id}`,
        score: Math.min(1, scoreT / 20),
        matchedTerms: Array.from(matched),
      });
    }
  }

  // ── 4. Assessments ──
  const assessments = listAssessments();
  for (const a of assessments) {
    let scoreT = 0;
    const matched = new Set<string>();
    const titleM = includesAny(a.title, terms);
    if (titleM.match) {
      scoreT += scoreOf(a.title, terms, 5);
      titleM.matched.forEach((m) => matched.add(m));
    }
    if (mode !== "BASIC") {
      const descM = includesAny(a.description, terms);
      if (descM.match) {
        scoreT += scoreOf(a.description, terms, 3);
        descM.matched.forEach((m) => matched.add(m));
      }
    }
    if (mode === "FULLTEXT" || mode === "SEMANTIC") {
      const text = `${a.instructions ?? ""} ${a.category}`;
      const m = includesAny(text, terms);
      if (m.match) {
        scoreT += scoreOf(text, terms, 1);
        m.matched.forEach((mm) => matched.add(mm));
      }
    }
    if (scoreT > 0) {
      results.push({
        id: `assess-${a.id}`,
        type: "assessment",
        title: a.title,
        snippet: snippet(a.description, Array.from(matched)),
        href: `/assessments/${a.id}`,
        score: Math.min(1, scoreT / 20),
        matchedTerms: Array.from(matched),
      });
    }
  }

  // ── Apply filters ──
  let filtered = results;
  if (filters?.types && filters.types.length > 0) {
    filtered = filtered.filter((r) =>
      filters.types!.includes(r.type as SearchResultType)
    );
  }

  // Sort by score desc
  filtered.sort((a, b) => b.score - a.score);

  return filtered;
}

export function searchAllModes(query: string): Record<SearchMode, number> {
  const modes: SearchMode[] = ["BASIC", "ADVANCED", "FULLTEXT", "SEMANTIC"];
  const counts: Partial<Record<SearchMode, number>> = {};
  for (const m of modes) {
    counts[m] = search({ query, mode: m }).length;
  }
  return counts as Record<SearchMode, number>;
}
