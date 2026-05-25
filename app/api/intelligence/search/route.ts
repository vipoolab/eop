// POST /api/intelligence/search
// Body: { query: string; mode: SearchMode; filters?: SearchFilters }
// Returns: SearchResult[]

import { NextRequest, NextResponse } from "next/server";
import { search, searchAllModes } from "@/lib/intelligence/search";
import type { SearchMode, SearchFilters } from "@/lib/intelligence/types";

export const dynamic = "force-dynamic";

interface SearchBody {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
  includeCounts?: boolean;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SearchBody;
  if (!body.query || !body.query.trim()) {
    return NextResponse.json({
      success: true,
      data: { results: [], counts: null },
    });
  }
  if (!body.mode) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุโหมดการค้นหา" },
      { status: 400 }
    );
  }

  await new Promise((r) => setTimeout(r, 200));

  const results = search({
    query: body.query,
    mode: body.mode,
    filters: body.filters,
  });

  const counts = body.includeCounts ? searchAllModes(body.query) : null;

  return NextResponse.json({
    success: true,
    data: { results, counts, query: body.query, mode: body.mode },
  });
}
