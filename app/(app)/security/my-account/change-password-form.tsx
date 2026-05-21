"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next.length < 8) {
      setError("รหัสผ่านใหม่ต้อง ≥ 8 ตัวอักษร");
      return;
    }
    if (next !== confirm) {
      setError("รหัสผ่านยืนยันไม่ตรง");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/security/my-account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปลี่ยนรหัสไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 max-w-md">
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          เปลี่ยนรหัสผ่านสำเร็จ
        </div>
      )}
      <input
        type="password"
        placeholder="รหัสผ่านปัจจุบัน"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
        autoComplete="current-password"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="รหัสผ่านใหม่ (≥ 8 ตัวอักษร)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="ยืนยันรหัสผ่านใหม่"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        เปลี่ยนรหัสผ่าน
      </button>
    </form>
  );
}
