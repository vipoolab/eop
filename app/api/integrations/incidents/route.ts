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

  // Intelligence reports require elevated role
  const canSeeIntel = ["ADMIN", "COMMANDER", "AUDITOR"].includes(session.user.role);

  const sp = req.nextUrl.searchParams;
  const sinceParam = sp.get("since");
  let since: Date | undefined;
  if (sinceParam) {
    const parsed = new Date(sinceParam);
    if (!isNaN(parsed.getTime())) since = parsed;
  }

  try {
    const all = await fetchAllIncidents({ since });
    const incidents = canSeeIntel
      ? all
      : all.filter((i) => i.source !== "intel");

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        sources: canSeeIntel ? ["191", "CCTV", "intel"] : ["191", "CCTV"],
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
