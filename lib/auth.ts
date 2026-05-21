// Auth.js v5 (NextAuth) — Credentials + bcrypt + Prisma + JWT session
// TOR 7.1.2: MFA + Local Authentication (One-way Hash via bcrypt)
// TOR 7.1.3: RBAC — role stored in JWT
// TOR 7.1.5: Audit Trail — log login events

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

// ─────────────────────────────────────────────
// Type augmentation
// ─────────────────────────────────────────────

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AppJWTFields {
  id: string;
  role: Role;
  rank?: string | null;
  unitCode?: string | null;
  refreshAt?: number; // unix ms — TTL for stale-while-revalidate user data
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      rank?: string | null;
      unitCode?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: Role;
    rank?: string | null;
    unitCode?: string | null;
  }
}

// ─────────────────────────────────────────────
// Login validation
// ─────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().optional().nullable(),
});

// TOR ๗.๑.๖ — Failed login lockout
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// JWT refresh interval — re-fetch user data from DB at most every 60s
const REFRESH_TTL_MS = 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success || !parsed.data) return null;
        const data = parsed.data; // narrowed

        const headers = (req?.headers as Headers | undefined) ?? null;
        const ipAddress =
          headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
          headers?.get?.("x-real-ip") ??
          "unknown";
        const userAgent = headers?.get?.("user-agent") ?? null;

        const user = await prisma.user.findUnique({
          where: { email: data.email },
          include: { unit: true },
        });

        // Helper: log failed attempt
        async function logFail(reason: "WRONG_PASS" | "USER_LOCKED" | "MFA_FAIL" | "UNKNOWN_USER" | "ACCOUNT_DISABLED") {
          await prisma.loginAttempt.create({
            data: {
              email: data.email,
              success: false,
              failReason: reason,
              ipAddress,
              userAgent,
            },
          });
        }

        if (!user) {
          await logFail("UNKNOWN_USER");
          return null;
        }

        if (!user.active) {
          await logFail("ACCOUNT_DISABLED");
          return null;
        }

        // ─── Check lockout (TOR ๗.๑.๖) ───
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await logFail("USER_LOCKED");
          return null;
        }

        // ─── Verify password ───
        const valid = await bcrypt.compare(
          data.password,
          user.passwordHash
        );

        if (!valid) {
          // Increment failed count + maybe lock
          const newCount = user.failedLoginCount + 1;
          const shouldLock = newCount >= LOCKOUT_THRESHOLD;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: newCount,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
            },
          });
          await logFail("WRONG_PASS");
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: shouldLock ? "auth.account.locked" : "auth.login.failed",
              target: `user:${user.id}`,
              details: { email: user.email, reason: "invalid_password", failedCount: newCount, locked: shouldLock },
              ip: ipAddress,
            },
          });
          return null;
        }

        // ─── Verify MFA if enabled (TOR ๗.๑.๒) ───
        if (user.mfaEnabled && user.mfaSecret) {
          if (!data.otp) {
            // Special signal: password OK but OTP required
            // Client will detect via failReason='MFA_FAIL' in LoginAttempt + redirect
            await logFail("MFA_FAIL");
            return null;
          }
          const { verifyTotp, hashRecoveryCode } = await import("@/features/security/mfa");
          let mfaOk = verifyTotp(data.otp, user.mfaSecret);
          if (!mfaOk && user.mfaRecoveryCodes.length > 0) {
            // Try recovery code
            const codeHash = hashRecoveryCode(data.otp);
            if (user.mfaRecoveryCodes.includes(codeHash)) {
              mfaOk = true;
              // Consume the recovery code
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  mfaRecoveryCodes: user.mfaRecoveryCodes.filter((c) => c !== codeHash),
                },
              });
              await prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: "user.mfa.recovery.used",
                  target: `user:${user.id}`,
                  ip: ipAddress,
                },
              });
            }
          }
          if (!mfaOk) {
            await logFail("MFA_FAIL");
            return null;
          }
        }

        // ─── Success — reset lockout + log ───
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        await prisma.loginAttempt.create({
          data: {
            email: user.email,
            success: true,
            ipAddress,
            userAgent,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "auth.login",
            target: `user:${user.id}`,
            details: {
              email: user.email,
              role: user.role,
              unitCode: user.unit?.code,
              mfaUsed: user.mfaEnabled,
            },
            ip: ipAddress,
            ua: userAgent,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          rank: user.rank,
          unitCode: user.unit?.code,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const t = token as typeof token & Partial<AppJWTFields>;

      // First sign-in: hydrate from user object + set refresh expiry
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          rank?: string | null;
          unitCode?: string | null;
          name?: string | null;
        };
        t.id = u.id ?? "";
        t.role = (u.role ?? "VIEWER") as Role;
        t.rank = u.rank;
        t.unitCode = u.unitCode;
        if (u.name) t.name = u.name;
        t.refreshAt = Date.now() + REFRESH_TTL_MS;
        return t;
      }

      // Session update event OR TTL expired → refetch fresh user data once
      const shouldRefresh =
        trigger === "update" ||
        (typeof t.refreshAt === "number" && Date.now() > t.refreshAt);

      if (shouldRefresh && t.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: t.id },
          select: { name: true, rank: true, role: true, active: true },
        });
        if (!fresh || !fresh.active) {
          // User no longer exists (e.g. DB was reset) OR deactivated → invalidate session
          return null as never;
        }
        t.name = fresh.name;
        t.rank = fresh.rank;
        t.role = fresh.role as Role;
        t.refreshAt = Date.now() + REFRESH_TTL_MS;
      }

      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & Partial<AppJWTFields>;
      if (session.user && t.id) {
        session.user.id = t.id;
        session.user.role = (t.role ?? "VIEWER") as Role;
        session.user.rank = t.rank;
        session.user.unitCode = t.unitCode;
        if (typeof t.name === "string") session.user.name = t.name;
      }
      return session;
    },
  },
});
