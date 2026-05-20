// GET /api/search — Unified search across 4 modes
// TOR 8.10.12 Intelligent Search

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  search,
  type SearchMode,
  type AdvancedFilters,
} from "@/features/search/repository";
import type { CommandStatus, CommandPriority } from "@/features/commands/types";

const VALID_MODES: SearchMode[] = ["basic", "advanced", "fulltext", "semantic"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const mode = (sp.get("mode") as SearchMode) || "basic";
  const query = sp.get("q") ?? "";

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json(
      {
        success: false,
        message: `mode ต้องเป็น ${VALID_MODES.join(" / ")}`,
      },
      { status: 400 }
    );
  }

  const filters: AdvancedFilters = {};
  if (sp.get("status")) filters.status = sp.get("status") as CommandStatus;
  if (sp.get("priority"))
    filters.priority = sp.get("priority") as CommandPriority;

  const parseDate = (s: string | null): Date | undefined => {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  };
  filters.dateFrom = parseDate(sp.get("dateFrom"));
  filters.dateTo = parseDate(sp.get("dateTo"));

  try {
    const result = await search({ mode, query, filters });

    // Audit log — search activity for security review
    if (query.trim()) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `search.${mode}`,
          target: `query:${query.slice(0, 100)}`,
          details: {
            mode,
            query,
            total: result.total,
            elapsedMs: result.elapsedMs,
            tokensUsed: result.tokensUsed,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Search failed:", err);
    const msg = err instanceof Error ? err.message : "ค้นหาไม่สำเร็จ";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
