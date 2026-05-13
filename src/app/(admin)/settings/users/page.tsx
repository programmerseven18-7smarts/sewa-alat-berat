import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manajemen User | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const roleColor = (role: string) => {
  if (role === "SUPER_ADMIN") return "error";
  if (role === "ADMIN") return "warning";
  if (role === "FINANCE") return "success";
  return "info";
};

export default async function UsersPage() {
  await requirePageAccess("pengguna");

  const data = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nama: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      userRoles: {
        select: {
          role: {
            select: {
              nama: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Manajemen User</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola akun pengguna sistem.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(user) => user.id}
          getTitle={(user) => user.nama}
          emptyMessage="Belum ada user terdaftar."
          columns={[
            { header: "Nama", className: "font-medium text-gray-800 dark:text-white/90", render: (user) => user.nama },
            { header: "Username", className: "font-mono text-xs text-brand-600 dark:text-brand-400", render: (user) => user.username },
            { header: "Email", className: "text-gray-500 dark:text-gray-400", render: (user) => user.email || "-" },
            {
              header: "Role",
              render: (user) => (
                <>
                  <Badge size="sm" color={roleColor(user.role)}>{user.role}</Badge>
                  {user.userRoles.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">{user.userRoles.map((item) => item.role.nama).join(", ")}</span>
                  )}
                </>
              ),
            },
            { header: "Status", className: "text-gray-500 dark:text-gray-400", render: (user) => user.status },
            { header: "Terdaftar", className: "text-gray-400", render: (user) => formatDate(user.createdAt) },
          ]}
        />
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} user terdaftar</p>
        </div>
      </div>
    </div>
  );
}
