import { NextRequest, NextResponse } from "next/server";
import { listForms, addForm, genFormId } from "@/lib/report-forms/store";
import type { ReportForm } from "@/lib/report-forms/types";

export async function GET() {
  const forms = listForms();
  return NextResponse.json({ data: forms });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Minimal validation
  if (!body.name || !body.fields || !Array.isArray(body.fields)) {
    return NextResponse.json({ error: "name and fields required" }, { status: 400 });
  }

  const form: ReportForm = {
    id: genFormId(),
    name: body.name,
    description: body.description ?? "",
    category: body.category ?? "ทั่วไป",
    fields: body.fields,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: body.createdBy ?? "system",
    createdByName: body.createdByName ?? "ผู้ดูแลระบบ",
    version: 1,
  };

  const saved = addForm(form);
  return NextResponse.json({ data: saved }, { status: 201 });
}
