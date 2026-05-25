// POST /api/intelligence/summary
// Body: { scope: string; period: string }
// Returns: ExecutiveSummary

import { NextRequest, NextResponse } from "next/server";
import {
  listSummaries,
  addSummary,
  genSummaryId,
} from "@/lib/intelligence/store";
import type { ExecutiveSummary } from "@/lib/intelligence/types";

export const dynamic = "force-dynamic";

interface SummaryBody {
  scope: string;
  period: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SummaryBody;
  if (!body.scope || !body.period) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ scope และ period" },
      { status: 400 }
    );
  }

  await new Promise((r) => setTimeout(r, 800));

  // Try to find an existing summary matching scope (loose match)
  const existing = listSummaries().find(
    (s) =>
      s.scope.toLowerCase().includes(body.scope.toLowerCase()) ||
      body.scope.toLowerCase().includes(s.scope.toLowerCase())
  );

  if (existing) {
    return NextResponse.json({
      success: true,
      data: { summary: existing, generated: false, source: "library" },
    });
  }

  // Otherwise — generate a fake summary
  const generated: ExecutiveSummary = generateMockSummary(body.scope, body.period);
  addSummary(generated);

  return NextResponse.json({
    success: true,
    data: { summary: generated, generated: true, source: "ai" },
  });
}

function generateMockSummary(scope: string, period: string): ExecutiveSummary {
  return {
    id: genSummaryId(),
    period,
    scope,
    generatedAt: new Date().toISOString(),
    headline: `สรุปสถานการณ์ "${scope}" ในรอบ ${period} — แนวโน้มภาพรวมทรงตัว มีจุดที่ต้องเฝ้าระวัง`,
    keyFindings: [
      `เหตุการณ์ทั้งหมดใน ${scope} ลดลงเล็กน้อย ๔.๒% เทียบกับช่วงก่อนหน้า`,
      "คดีอาชญากรรมออนไลน์ยังคงเป็นแนวโน้มหลัก เพิ่มขึ้น ๒๑%",
      "ระยะเวลาตอบสนองเหตุฉุกเฉินเฉลี่ย ๙ นาที ๒ วินาที ดีขึ้นจากช่วงก่อน",
      "ความพึงพอใจของประชาชนต่องานตำรวจในพื้นที่อยู่ที่ ๗๘.๔%",
    ],
    trends: [
      { metric: "อาชญากรรมรวม", change: -4.2, direction: "down" },
      { metric: "อาชญากรรมออนไลน์", change: 21.0, direction: "up" },
      { metric: "เวลาตอบสนอง", change: -8.0, direction: "down" },
      { metric: "ความพึงพอใจ", change: 2.1, direction: "up" },
    ],
    recommendations: [
      "ขยายโครงการ Smart Community ให้ครอบคลุมพื้นที่เสี่ยงมากขึ้น",
      "เพิ่มความถี่ในการอบรมเจ้าหน้าที่เรื่อง AI Tools",
      "ทำงานเชิงรุกในการแจ้งเตือนประชาชนเกี่ยวกับ scam ผ่าน Social Media",
    ],
    data: [
      { label: "ลักทรัพย์", value: 482 },
      { label: "ทำร้ายร่างกาย", value: 264 },
      { label: "ยาเสพติด", value: 392 },
      { label: "อุบัติเหตุ", value: 510 },
      { label: "ฉ้อโกง", value: 184 },
      { label: "ออนไลน์", value: 268 },
    ],
  };
}
