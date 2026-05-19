"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "commander@eop.test", role: "ผบ.ตร. (Commander)", password: "demo1234" },
  { email: "staff@eop.test", role: "เจ้าหน้าที่ (Staff)", password: "demo1234" },
  { email: "admin@eop.test", role: "ผู้ดูแลระบบ (Admin)", password: "demo1234" },
  { email: "auditor@eop.test", role: "ผู้ตรวจสอบ (Auditor)", password: "demo1234" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setIsSubmitting(false);
      return;
    }

    if (result?.ok) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    setIsSubmitting(false);
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo1234");
    setError("");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold tracking-tight">
              EOP
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">
                สำนักงานยุทธศาสตร์ตำรวจ
              </div>
              <div className="text-sm text-slate-500">
                Enterprise Operation Planning
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            เข้าสู่ระบบ
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            ระบบวางแผนและติดตามการปฏิบัติงาน — Phase 1 MVP
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-shadow"
                  placeholder="commander@eop.test"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition-shadow"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* MFA notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ระบบสนับสนุน Multi-Factor Authentication (MFA)</span>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                />
                จำการเข้าสู่ระบบ
              </label>
              <button
                type="button"
                className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>© พ.ศ. 2569 สำนักงานยุทธศาสตร์ตำรวจ</p>
            <p className="mt-1">Enterprise Operation Planning System</p>
          </div>
        </div>
      </div>

      {/* Right side — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(99,102,241,0.25), transparent 60%)",
          }}
        />

        <div className="relative max-w-md text-white">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pre-PoC Demo · Phase 1 MVP
            </div>
            <h2 className="text-3xl font-semibold leading-tight mb-3 tracking-tight">
              Strategic Operations,
              <br />
              unified at scale.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              ระบบบูรณาการการวางแผนยุทธศาสตร์เข้ากับการปฏิบัติการของสำนักงานตำรวจแห่งชาติ
              — ครอบคลุม 7 ระบบหลัก พร้อม AI, Big Data และ XR Command Center
            </p>
          </div>

          {/* Demo accounts */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Demo Accounts
              </h3>
              <button
                onClick={() => setShowDemo((v) => !v)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showDemo ? "ซ่อน" : "แสดง"}
              </button>
            </div>

            {showDemo && (
              <>
                <p className="text-xs text-slate-400 mb-3">
                  คลิกบัญชีเพื่อกรอกอัตโนมัติ · รหัสผ่าน{" "}
                  <code className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">
                    demo1234
                  </code>
                </p>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemoAccount(acc.email)}
                      className="w-full text-left rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 p-3 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium font-mono truncate">
                            {acc.email}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {acc.role}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Key features */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { value: "7", label: "ระบบหลัก" },
              { value: "20+", label: "Screens" },
              { value: "AI", label: "Powered" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center"
              >
                <div className="text-lg font-semibold text-white">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
