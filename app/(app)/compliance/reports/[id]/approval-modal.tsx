"use client";

// e-Signature approval modal for ComplianceReport (TOR ๓.๑)
// แบบ "พิมพ์ลายเซ็น" — ไม่ใช่ canvas เพราะให้ใช้บน mobile/keyboard ได้สะดวก

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Pen,
} from "lucide-react";

interface Props {
  reportId: string;
  approverName: string; // user.name
  approverRank: string | null;
  reportTitle: string;
  onClose: () => void;
}

export function ApprovalModal({
  reportId,
  approverName,
  approverRank,
  reportTitle,
  onClose,
}: Props) {
  const router = useRouter();
  const [typedName, setTypedName] = useState(
    `${approverRank ?? ""} ${approverName}`.trim()
  );
  const [confirmed, setConfirmed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawDataUrl, setDrawDataUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas setup
  useEffect(() => {
    if (signatureMode !== "draw" || !canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [signatureMode]);

  function getPoint(
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    if ("touches" in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    if ("clientX" in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
    return null;
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const p = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!p || !ctx) return;
    setDrawing(true);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function continueDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!p || !ctx) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() {
    setDrawing(false);
    if (canvasRef.current) {
      setDrawDataUrl(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clearCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    setDrawDataUrl("");
  }

  async function submit() {
    setError(null);
    if (!confirmed) {
      setError("ต้องติ๊กยืนยันก่อนลงนาม");
      return;
    }

    let signatureData = "";
    if (signatureMode === "type") {
      if (typedName.trim().length < 3) {
        setError("พิมพ์ชื่อ-ยศ อย่างน้อย 3 ตัวอักษร");
        return;
      }
      // Wrap typed name with timestamp + report id to make signature unique
      signatureData = JSON.stringify({
        type: "typed",
        name: typedName.trim(),
        timestamp: new Date().toISOString(),
        reportId,
      });
    } else {
      if (!drawDataUrl || drawDataUrl.length < 100) {
        setError("กรุณาวาดลายเซ็นก่อน");
        return;
      }
      signatureData = drawDataUrl;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/compliance/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อนุมัติไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ลงนามอนุมัติรายงาน
            </h2>
            <p className="text-xs text-slate-500 mt-1 truncate">{reportTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSignatureMode("type")}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md border ${
                signatureMode === "type"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              พิมพ์ลายเซ็น
            </button>
            <button
              onClick={() => setSignatureMode("draw")}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md border inline-flex items-center justify-center gap-1 ${
                signatureMode === "draw"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              <Pen className="h-3 w-3" />
              วาดลายเซ็น
            </button>
          </div>

          {/* Signature input */}
          {signatureMode === "type" ? (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                ชื่อ-ยศ ผู้อนุมัติ
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-serif text-base italic"
                placeholder="พล.ต.อ. สมชาย ใจดี"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                ระบบจะเก็บชื่อ + เวลา + IP เพื่อ Audit
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                วาดลายเซ็น
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-md bg-slate-50">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="block w-full bg-white rounded-md cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={continueDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={continueDraw}
                  onTouchEnd={endDraw}
                />
              </div>
              <button
                onClick={clearCanvas}
                className="text-[11px] text-slate-500 hover:text-slate-900 mt-1"
              >
                ล้างลายเซ็น
              </button>
            </div>
          )}

          {/* Confirmation */}
          <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              ข้าพเจ้าได้ตรวจสอบรายงานนี้แล้ว และอนุมัติด้วยลายเซ็นอิเล็กทรอนิกส์
              ของข้าพเจ้า เพื่อนำส่งหน่วยประเมินภายนอก
            </span>
          </label>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
            ⚠️ การลงนามมีผลทางกฎหมาย — ระบบจะบันทึก IP, User Agent, Timestamp
            ลงใน Audit Trail
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy || !confirmed}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            ลงนามอนุมัติ
          </button>
        </div>
      </div>
    </div>
  );
}
