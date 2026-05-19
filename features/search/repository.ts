// Search Repository — 4 search modes
// TOR 8.10.12 — Intelligent Search

import { prisma } from "@/lib/prisma";
import { getClaude, MODELS } from "@/lib/claude";
import type { Prisma } from "@/lib/generated/prisma";
import type { CommandStatus, CommandPriority } from "@/features/commands/types";

export type SearchMode = "basic" | "advanced" | "fulltext" | "semantic";

export interface SearchHit {
  type: "command" | "document";
  id: string;
  title: string;
  snippet: string;
  meta: Record<string, string | number | null>;
  /** Relevance score (semantic mode only) */
  score?: number;
}

export interface SearchResult {
  mode: SearchMode;
  query: string;
  hits: SearchHit[];
  total: number;
  elapsedMs: number;
  /** AI reasoning (semantic mode) */
  aiReasoning?: string;
  /** Tokens used (semantic mode) */
  tokensUsed?: number;
}

export interface AdvancedFilters {
  status?: CommandStatus;
  priority?: CommandPriority;
  dateFrom?: Date;
  dateTo?: Date;
  unitCode?: string;
}

// ─────────────────────────────────────────────
// 1. Basic Search — substring match in subject + docNo
// ─────────────────────────────────────────────

export async function basicSearch(query: string): Promise<SearchHit[]> {
  if (!query.trim()) return [];

  const commands = await prisma.command.findMany({
    where: {
      OR: [
        { subject: { contains: query, mode: "insensitive" } },
        { docNo: { contains: query } },
        { recipient: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, rank: true } } },
  });

  return commands.map((c) => ({
    type: "command" as const,
    id: c.id,
    title: c.subject,
    snippet: c.body.slice(0, 200),
    meta: {
      docNo: c.docNo,
      status: c.status,
      priority: c.priority,
      creator: `${c.creator.rank ?? ""} ${c.creator.name}`.trim(),
      createdAt: c.createdAt.toISOString(),
    },
  }));
}

// ─────────────────────────────────────────────
// 2. Advanced Search — multi-field filters
// ─────────────────────────────────────────────

export async function advancedSearch(args: {
  query?: string;
  filters: AdvancedFilters;
}): Promise<SearchHit[]> {
  const { query, filters } = args;
  const where: Prisma.CommandWhereInput = {};

  if (query?.trim()) {
    where.OR = [
      { subject: { contains: query, mode: "insensitive" } },
      { body: { contains: query, mode: "insensitive" } },
      { docNo: { contains: query } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const commands = await prisma.command.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, rank: true } } },
  });

  return commands.map((c) => ({
    type: "command" as const,
    id: c.id,
    title: c.subject,
    snippet: c.body.slice(0, 200),
    meta: {
      docNo: c.docNo,
      status: c.status,
      priority: c.priority,
      creator: `${c.creator.rank ?? ""} ${c.creator.name}`.trim(),
      createdAt: c.createdAt.toISOString(),
    },
  }));
}

// ─────────────────────────────────────────────
// 3. Full-text Search — Postgres ILIKE across many fields
//    (Real implementation should use to_tsvector; this is demo-friendly)
// ─────────────────────────────────────────────

export async function fulltextSearch(query: string): Promise<SearchHit[]> {
  if (!query.trim()) return [];
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return [];

  // Build AND query: each term must appear in any field
  const where = {
    AND: terms.map((term) => ({
      OR: [
        { subject: { contains: term, mode: "insensitive" as const } },
        { body: { contains: term, mode: "insensitive" as const } },
        { objective: { contains: term, mode: "insensitive" as const } },
        { reference: { contains: term, mode: "insensitive" as const } },
        { recipient: { contains: term, mode: "insensitive" as const } },
        { docNo: { contains: term } },
      ],
    })),
  };

  const [commands, documents] = await Promise.all([
    prisma.command.findMany({
      where,
      take: 30,
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true, rank: true } } },
    }),
    prisma.document.findMany({
      where: {
        AND: terms.map((term) => ({
          OR: [
            {
              originalName: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
            {
              contentText: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
          ],
        })),
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hits: SearchHit[] = [
    ...commands.map((c) => ({
      type: "command" as const,
      id: c.id,
      title: c.subject,
      snippet: c.body.slice(0, 200),
      meta: {
        docNo: c.docNo,
        status: c.status,
        priority: c.priority,
        creator: `${c.creator.rank ?? ""} ${c.creator.name}`.trim(),
        createdAt: c.createdAt.toISOString(),
      },
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      id: d.id,
      title: d.originalName,
      snippet: (d.contentText ?? "").slice(0, 200),
      meta: {
        mimeType: d.mimeType,
        size: d.size,
        classifiedUnit: d.classifiedUnit,
        createdAt: d.createdAt.toISOString(),
      },
    })),
  ];

  return hits;
}

// ─────────────────────────────────────────────
// 4. Semantic Search — Claude-powered relevance scoring
//    Strategy: fetch candidates (basic), then ask Claude to rank by meaning
// ─────────────────────────────────────────────

interface RankedCandidate {
  index: number;
  score: number;
  reason: string;
}

export async function semanticSearch(query: string): Promise<{
  hits: SearchHit[];
  aiReasoning: string;
  tokensUsed: number;
}> {
  if (!query.trim()) {
    return { hits: [], aiReasoning: "", tokensUsed: 0 };
  }

  // Step 1: Fetch candidate set — recent + keyword-matched
  // (in production: would use vector embeddings + pgvector ANN search)
  const candidates = await prisma.command.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, rank: true } } },
  });

  if (candidates.length === 0) {
    return { hits: [], aiReasoning: "ไม่มีคำสั่งในระบบ", tokensUsed: 0 };
  }

  // Step 2: Ask Claude to rank by semantic relevance
  const candidatesText = candidates
    .map(
      (c, i) =>
        `[${i}] ${c.docNo}: ${c.subject}\n   ${c.body.slice(0, 250)}`
    )
    .join("\n\n");

  const systemPrompt = `คุณเป็นผู้ช่วยค้นหาเอกสารราชการที่เข้าใจความหมาย ไม่ใช่แค่ keyword

# หน้าที่
ให้ผู้ใช้พิมพ์คำค้นด้วยภาษาธรรมชาติ — เลือกคำสั่งที่ "เกี่ยวข้องในความหมาย" ที่สุด

# เทคนิค
- เข้าใจคำพ้อง / synonyms (เช่น "ปราบยาเสพติด" ≈ "เร่งรัดดำเนินคดียาเสพติด")
- เข้าใจ context (เช่น "ภัยพิบัติ" ครอบคลุม น้ำท่วม ไฟไหม้ ฯลฯ)
- ให้คะแนนความเกี่ยวข้อง 0.0-1.0
- เลือกเฉพาะที่เกี่ยวข้องจริง (≥ 0.3) — สูงสุด 10 รายการ

# Output: JSON array (ไม่ต้องอธิบายเพิ่ม)
{
  "matches": [
    { "index": <int>, "score": 0.0-1.0, "reason": "เหตุผลสั้นๆ" }
  ],
  "queryAnalysis": "อธิบายว่าคำค้นนี้หมายถึงอะไร 1 ประโยค"
}`;

  const response = await getClaude().messages.create({
    model: MODELS.HAIKU,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `# คำค้น\n"${query}"\n\n# คำสั่งทั้งหมด (${candidates.length} รายการ)\n${candidatesText}\n\nกรุณาเลือกที่เกี่ยวข้องและส่งคืน JSON`,
      },
    ],
  });

  const textOut = response.content.find((b) => b.type === "text");
  if (!textOut || textOut.type !== "text") {
    return { hits: [], aiReasoning: "AI ไม่ตอบกลับ", tokensUsed: 0 };
  }

  const raw = textOut.text
    .trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: { matches?: RankedCandidate[]; queryAnalysis?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      hits: [],
      aiReasoning: "AI ตอบกลับไม่ถูก format",
      tokensUsed:
        response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  const ranked = parsed.matches ?? [];
  const hits: SearchHit[] = ranked
    .map((r): SearchHit | null => {
      const idx = typeof r.index === "number" ? r.index : -1;
      const cmd = candidates[idx];
      if (!cmd) return null;
      return {
        type: "command",
        id: cmd.id,
        title: cmd.subject,
        snippet: cmd.body.slice(0, 200),
        meta: {
          docNo: cmd.docNo,
          status: String(cmd.status),
          priority: String(cmd.priority),
          creator: `${cmd.creator.rank ?? ""} ${cmd.creator.name}`.trim(),
          createdAt: cmd.createdAt.toISOString(),
          aiReason: r.reason,
        },
        score: r.score,
      };
    })
    .filter((h): h is SearchHit => h !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return {
    hits,
    aiReasoning: parsed.queryAnalysis ?? "",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

// ─────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────

export async function search(args: {
  mode: SearchMode;
  query: string;
  filters?: AdvancedFilters;
}): Promise<SearchResult> {
  const t0 = Date.now();
  let hits: SearchHit[] = [];
  let aiReasoning: string | undefined;
  let tokensUsed: number | undefined;

  switch (args.mode) {
    case "basic":
      hits = await basicSearch(args.query);
      break;
    case "advanced":
      hits = await advancedSearch({
        query: args.query,
        filters: args.filters ?? {},
      });
      break;
    case "fulltext":
      hits = await fulltextSearch(args.query);
      break;
    case "semantic": {
      const r = await semanticSearch(args.query);
      hits = r.hits;
      aiReasoning = r.aiReasoning;
      tokensUsed = r.tokensUsed;
      break;
    }
  }

  return {
    mode: args.mode,
    query: args.query,
    hits,
    total: hits.length,
    elapsedMs: Date.now() - t0,
    aiReasoning,
    tokensUsed,
  };
}
