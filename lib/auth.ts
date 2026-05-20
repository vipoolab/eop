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
});

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
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { unit: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!valid) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "auth.login.failed",
              target: `user:${user.id}`,
              details: { email: user.email, reason: "invalid_password" },
            },
          });
          return null;
        }

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "auth.login",
            target: `user:${user.id}`,
            details: {
              email: user.email,
              role: user.role,
              unitCode: user.unit?.code,
            },
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
        if (fresh) {
          if (!fresh.active) {
            // Force re-login if deactivated
            return null as never;
          }
          t.name = fresh.name;
          t.rank = fresh.rank;
          t.role = fresh.role as Role;
        }
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
