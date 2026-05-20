// GET /api/integrations/incidents — Unified incident feed
// Sources: 191 + CCTV + Intelligence (TOR 6.4.2)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAllIncidents } from "@/features/integrations/external";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const sinceParam = sp.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  try {
    const incidents = await fetchAllIncidents({ since });
    return NextResponse.json({
      success: true,
      data: {
        incidents,
        sources: ["191", "CCTV", "intel"],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
