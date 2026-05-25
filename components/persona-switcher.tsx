"use client";

// Persona switcher in header — lets demo presenter change "current user"
// to show how command visibility differs by rank/unit.

import { useState, useEffect } from "react";
import { ChevronDown, UserCog, Check } from "lucide-react";
import type { OrgUnit, Persona } from "@/lib/police-org/types";

interface PersonaApiData {
  active: Persona;
  unit: OrgUnit | null;
  personas: (Persona & { unit?: OrgUnit | null })[];
}

export function PersonaSwitcher() {
  const [data, setData] = useState<PersonaApiData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/persona")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => {});
  }, []);

  async function switchTo(id: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/persona", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (j.success) {
        setOpen(false);
        // Reload to refresh server-rendered persona-dependent UI
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="text-xs text-slate-400 px-3">กำลังโหลด persona...</div>
    );
  }

  const active = data.active;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-colors"
      >
        <div className="h-9 w-9 rounded-sm bg-[#1e3a5f] flex items-center justify-center text-white text-[10px] font-bold border border-[#142a45]">
          <UserCog className="h-4 w-4" />
        </div>
        <div className="text-right pr-1">
          <div className="text-sm font-medium text-slate-900 leading-tight">
            {active.rank} {active.name.split(" ").slice(1).join(" ")}
          </div>
          <div className="text-xs text-slate-500 leading-tight">
            {active.role}
            {data.unit && (
              <span className="ml-1 text-slate-400">• {data.unit.shortName ?? data.unit.code}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-96 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                สวมบทบาท (Demo Persona)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                เลือกตำแหน่งเพื่อดูว่า ผู้บังคับบัญชาแต่ละระดับ
                เห็น/บัญชาการ หน่วยใดได้บ้าง
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto py-1">
              {data.personas.map((p) => {
                const isActive = p.id === active.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchTo(p.id)}
                    disabled={loading || isActive}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 disabled:cursor-default ${
                      isActive ? "bg-[#1e3a5f]/[0.04]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900 flex-1">
                        {p.rank} {p.name.split(" ").slice(1).join(" ")}
                      </div>
                      {isActive && (
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      <span className="font-medium">{p.role}</span>
                      {p.unit && (
                        <span className="ml-1 text-slate-400">
                          • {p.unit.shortName ?? p.unit.code}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {p.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
