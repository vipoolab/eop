"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  ShieldOff,
} from "lucide-react";

type Step = "idle" | "setup" | "verify" | "done";

export function MfaSection({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/security/my-account/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setQrUrl(data.data.qrUrl);
      setSecret(data.data.secret);
      setStep("setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่สามารถเริ่มตั้งค่า MFA");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    if (token.length !== 6) {
      setError("กรอก 6 หลัก");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/security/my-account/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setRecoveryCodes(data.data.recoveryCodes);
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "verify ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    if (!confirm("ปิด MFA จะทำให้บัญชีปลอดภัยน้อยลง — แน่ใจ?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/security/my-account/mfa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ปิดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  function copyRecovery() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    alert("คัดลอกแล้ว");
  }

  function downloadRecovery() {
    const blob = new Blob(
      [
        "EOP MFA Recovery Codes\n",
        "เก็บไว้ในที่ปลอดภัย — ใช้กรณีฉุกเฉินเมื่อมือถือหายเท่านั้น\n",
        "แต่ละ code ใช้ได้ครั้งเดียว\n\n",
        ...recoveryCodes.map((c, i) => `${i + 1}. ${c}\n`),
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eop-mfa-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Already enabled ───
  if (enabled && step !== "done") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          MFA เปิดใช้งานอยู่ — login ครั้งถัดไปต้องกรอก code จาก Authenticator
        </div>
        <button
          onClick={disableMfa}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white text-rose-700 px-3 py-1.5 text-sm hover:bg-rose-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
          ปิดใช้งาน MFA
        </button>
      </div>
    );
  }

  // ─── Done — show recovery codes ───
  if (step === "done") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          ✅ เปิด MFA สำเร็จ — เก็บ Recovery Codes ด้านล่างให้ปลอดภัย
        </div>
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider mb-2">
            ⚠️ Recovery Codes (แต่ละ code ใช้ได้ครั้งเดียว — ใช้กรณีเสียมือถือ)
          </div>
          <div className="grid grid-cols-2 gap-1 mb-3 font-mono text-[12px]">
            {recoveryCodes.map((c, i) => (
              <div key={i} className="bg-white rounded px-2 py-1 border border-amber-200">
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyRecovery}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-white border border-amber-300 px-2 py-1 hover:bg-amber-100"
            >
              <Copy className="h-3 w-3" /> คัดลอก
            </button>
            <button
              onClick={downloadRecovery}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-white border border-amber-300 px-2 py-1 hover:bg-amber-100"
            >
              <Download className="h-3 w-3" /> ดาวน์โหลด .txt
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setStep("idle");
            setRecoveryCodes([]);
            router.refresh();
          }}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          เสร็จสิ้น
        </button>
      </div>
    );
  }

  // ─── Setup step ───
  if (step === "setup") {
    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
          <li>ติดตั้ง <strong>Google Authenticator</strong> หรือ <strong>Microsoft Authenticator</strong> บนมือถือ</li>
          <li>เปิดแอป → กด + → สแกน QR code ด้านล่าง</li>
          <li>กรอกเลข 6 หลักที่แอปสร้างขึ้น</li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-3 text-center">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="MFA QR Code" className="block mx-auto" />
            ) : (
              <div className="text-slate-400 py-12">QR Code</div>
            )}
            <details className="mt-2 text-left">
              <summary className="text-[10px] text-slate-500 cursor-pointer">
                หรือกรอก secret ด้วยตัวเอง
              </summary>
              <code className="block mt-1 text-[10px] bg-slate-50 px-2 py-1 rounded font-mono break-all">
                {secret}
              </code>
            </details>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              เลข 6 หลักจากแอป
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-md border-2 border-slate-300 px-3 py-2 text-2xl text-center tabular-nums font-mono tracking-widest"
            />
            <div className="flex gap-2">
              <button
                onClick={verify}
                disabled={loading || token.length !== 6}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                ยืนยัน + เปิด MFA
              </button>
              <button
                onClick={() => setStep("idle")}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Idle ───
  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <p className="text-sm text-slate-600">
        เปิด MFA เพื่อยืนยันตัวตน 2 ขั้นทุกครั้งที่ login (รหัสผ่าน + เลขจากแอป Authenticator)
      </p>
      <button
        onClick={startSetup}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        เปิดใช้งาน MFA
      </button>
    </div>
  );
}
