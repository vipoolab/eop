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
// Type augmentation — add custom fields to session
// ─────────────────────────────────────────────

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

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

// Note: JWT augmentation removed — Auth.js v5 doesn't expose next-auth/jwt module
// Custom fields are typed via the User interface above

// ─────────────────────────────────────────────
// Login validation
// ─────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

// ─────────────────────────────────────────────
// Auth.js config
// ─────────────────────────────────────────────

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
        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        // Find user + unit
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { unit: true },
        });

        if (!user || !user.active) {
          return null;
        }

        // Verify password (bcrypt one-way hash — TOR 7.1.2)
        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!valid) {
          // Log failed login attempt
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

        // Log successful login (TOR 7.1.5 Audit Trail)
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
    async jwt({ token, user }) {
      // First sign in — copy from User object
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          rank?: string | null;
          unitCode?: string | null;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).id = u.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = u.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).rank = u.rank;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).unitCode = u.unitCode;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose custom fields to client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = token as any;
      if (session.user && t.id) {
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.rank = t.rank;
        session.user.unitCode = t.unitCode;

        // Re-fetch latest name from DB (in case it was updated post-login)
        // Note: small perf cost per request; acceptable for demo phase
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: t.id },
            select: { name: true, rank: true },
          });
          if (fresh) {
            session.user.name = fresh.name;
            session.user.rank = fresh.rank;
          }
        } catch {
          // ignore — keep cached values
        }
      }
      return session;
    },
  },
});
