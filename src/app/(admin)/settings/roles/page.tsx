import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RolePermissionManager from "@/components/rbac/RolePermissionManager";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Role & Permission | Sistem Sewa Alat Berat",
  description: "Kelola role dan hak akses sistem sewa alat berat",
};

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePageAccess("role_permission");

  const roles = await prisma.role.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      kode: true,
      nama: true,
      deskripsi: true,
      _count: {
        select: {
          userRoles: true,
        },
      },
      rolePermissions: {
        select: {
          permission: {
            select: {
              kode: true,
            },
          },
        },
      },
    },
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Role & Permission" />
      <RolePermissionManager
        roles={roles.map((role) => ({
          id: role.id,
          kode: role.kode,
          nama: role.nama,
          deskripsi: role.deskripsi,
          userCount: role._count.userRoles,
          permissionCodes: role.rolePermissions.map((item) => item.permission.kode),
        }))}
      />
    </div>
  );
}
