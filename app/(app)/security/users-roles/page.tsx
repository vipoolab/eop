// /security/users-roles — User CRUD + Roles (TOR ๗.๑.๑ + ๗.๑.๓)

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Users as UsersIcon } from "lucide-react";
import { UsersRolesView } from "./users-roles-view";

export const dynamic = "force-dynamic";

export default async function UsersRolesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/security");

  const [users, units, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        unit: { select: { code: true, name: true } },
      },
    }),
    prisma.unit.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
      take: 200,
    }),
    prisma.role.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
        rolePermissions: {
          include: { permission: { select: { code: true, action: true, resource: true } } },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={UsersIcon}
        eyebrow="Security · TOR 7.1.1 / 7.1.3"
        title="บัญชี & สิทธิ์"
        description="จัดการบัญชีผู้ใช้ + บทบาท + สิทธิ์ — สำหรับ Admin"
      />

      <UsersRolesView
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          rank: u.rank,
          role: u.role,
          active: u.active,
          mfaEnabled: u.mfaEnabled,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          lockedUntil: u.lockedUntil?.toISOString() ?? null,
          failedLoginCount: u.failedLoginCount,
          mustChangePassword: u.mustChangePassword,
          unit: u.unit ? { code: u.unit.code, name: u.unit.name } : null,
        }))}
        units={units}
        roles={roles.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          active: r.active,
          userCount: r._count.users,
          permissionCount: r._count.rolePermissions,
          permissions: r.rolePermissions.map((rp) => rp.permission),
        }))}
      />
    </div>
  );
}
