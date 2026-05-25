// Demo mode — RBAC stub.
// Always succeeds since there's no real auth in demo. Keeps the call sites
// working without rewriting every page.

import { DEMO_USER, type DemoRole } from "@/lib/auth";

export async function requireRole(_allowed: DemoRole[]) {
  // In demo mode, the single user is ADMIN — passes any role check.
  return DEMO_USER;
}

export function hasRole(user: { role?: string } | undefined, allowed: DemoRole[]) {
  if (!user?.role) return false;
  return allowed.includes(user.role as DemoRole);
}
