"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    email: "commander@eop.test",
    role: "ผู้บังคับบัญชา (Commander)",
    password: "demo1234",
  },
  {
    email: "staff@eop.test",
    role: "เจ้าหน้าที่ (Staff)",
    password: "demo1234",
  },
  {
    email: "admin@eop.test",
    role: "ผู้ดูแลระบบ (Admin)",
    password: "demo1234",
  },
  {
    email: "auditor@eop.test",
    role: "ผู้ตรวจสอบ (Auditor)",
    password: "demo1234",
  },
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
    <div className="min-h-screen flex bg-white">
      {/* Left — Login form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12">
        {/* Official header */}
        <div className="flex items-center gap-3 pb-4 mb-8 border-b border-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-[#1e3a5f] bg-white">
            <span className="font-serif text-lg font-bold text-[#1e3a5f] tracking-tight">
              EOP
            </span>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#b8860b] uppercase tracking-wider">
              Royal Thai Police
            </div>
            <div className="text-lg font-semibold text-slate-900 leading-tight">
              สำนักงานยุทธศาสตร์ตำรวจ
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              สำนักงานตำรวจแห่งชาติ
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1.5 tracking-tight">
              เข้าสู่ระบบ
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              ระบบบูรณาการการวางแผนยุทธศาสตร์และติดตามการปฏิบัติงาน
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full rounded-sm border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] transition-shadow"
                    placeholder="commander@eop.test"
                    autoComplete="email"
                  />
                </div>
              </div>

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
                    className="w-full rounded-sm border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] transition-shadow"
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

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  ระบบสนับสนุน Multi-Factor Authentication (MFA)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded-sm border-slate-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                  จดจำการเข้าสู่ระบบ
                </label>
                <button
                  type="button"
                  className="text-sm text-[#1e3a5f] hover:underline font-medium"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-sm border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-sm bg-[#1e3a5f] text-white py-2.5 text-sm font-semibold tracking-wide hover:bg-[#142a45] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#142a45]"
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-8 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>© พุทธศักราช ๒๕๖๙ สำนักงานตำรวจแห่งชาติ</p>
          <p className="mt-1 text-slate-400">
            ใช้ภายในหน่วยงานเท่านั้น · Restricted · Internal Use Only
          </p>
        </div>
      </div>

      {/* Right — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a5f] items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Gold corner accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#d4a017]" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d4a017]" />

        <div className="relative max-w-md text-white">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 border border-[#d4a017]/40 bg-[#d4a017]/10 px-3 py-1 text-[11px] font-medium text-[#d4a017] mb-6 tracking-wider uppercase">
              ระบบราชการ · Phase 1 MVP
            </div>
            <h2 className="text-[28px] font-semibold leading-tight mb-4 tracking-tight">
              ระบบบูรณาการ
              <br />
              การวางแผนยุทธศาสตร์
              <br />
              <span className="text-[#d4a017]">
                และการปฏิบัติการ
              </span>
            </h2>
            <div className="h-px w-16 bg-[#d4a017] mb-4" />
            <p className="text-slate-300 text-sm leading-relaxed">
              ระบบบูรณาการการวางแผนยุทธศาสตร์เข้ากับการปฏิบัติการของสำนักงานตำรวจแห่งชาติ
              ครอบคลุม 7 ระบบหลัก พร้อมเทคโนโลยี AI, Big Data
              และ XR Command Center
              เพื่อยกระดับขีดความสามารถในการบริหารและสั่งการ
            </p>
          </div>

          {/* Demo accounts */}
          <div className="border border-white/15 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d4a017]">
                บัญชีทดสอบ · Demo Accounts
              </h3>
              <button
                onClick={() => setShowDemo((v) => !v)}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {showDemo ? "ซ่อน" : "แสดง"}
              </button>
            </div>

            {showDemo && (
              <>
                <p className="text-[11px] text-slate-400 mb-3">
                  คลิกบัญชีเพื่อกรอกอัตโนมัติ · รหัสผ่าน{" "}
                  <code className="bg-white/10 text-white px-1.5 py-0.5 font-mono">
                    demo1234
                  </code>
                </p>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemoAccount(acc.email)}
                      className="w-full text-left bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-[#d4a017]/50 p-2.5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium font-mono truncate text-white">
                            {acc.email}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {acc.role}
                          </div>
                        </div>
                        <span className="text-xs text-[#d4a017] opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              { value: "7", label: "ระบบหลัก" },
              { value: "20+", label: "หน้าจอ" },
              { value: "AI", label: "ขับเคลื่อน" },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-white/10 bg-white/[0.02] p-3 text-center"
              >
                <div className="text-lg font-semibold text-[#d4a017]">
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
