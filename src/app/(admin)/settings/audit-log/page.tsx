import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audit Log | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  await requirePageAccess("audit_log");

  const data = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      user: {
        select: {
          nama: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Audit Log</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Jejak aktivitas penting pengguna di sistem.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(row) => row.id}
          getTitle={(row) => row.action}
          emptyMessage="Belum ada audit log"
          minWidth={920}
          columns={[
            { header: "Waktu", className: "text-gray-500 dark:text-gray-400", render: (row) => formatDate(row.createdAt) },
            { header: "User", className: "text-gray-800 dark:text-white/90", render: (row) => row.user?.nama || "System" },
            { header: "Aksi", className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400", render: (row) => row.action },
            { header: "Entity", className: "text-gray-500 dark:text-gray-400", render: (row) => row.entityType },
            { header: "ID", className: "text-gray-500 dark:text-gray-400", render: (row) => row.entityId || "-" },
            { header: "Metadata", className: "text-xs text-gray-400", render: (row) => row.metadata ? JSON.stringify(row.metadata) : "-" },
          ]}
        />
      </div>
    </div>
  );
}
