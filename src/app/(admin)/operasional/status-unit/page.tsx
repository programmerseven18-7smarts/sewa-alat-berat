import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Status Unit | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const statusColor = (status: string) => {
  if (status === "Stand By") return "success";
  if (status === "Break Down") return "error";
  if (status === "Maintenance") return "warning";
  return "info";
};

export default async function StatusUnitPage() {
  await requirePageAccess("status_unit");

  const data = await prisma.equipmentUnit.findMany({
    orderBy: [{ status: "asc" }, { kodeLambung: "asc" }],
    select: {
      id: true,
      kodeLambung: true,
      merk: true,
      model: true,
      status: true,
      category: { select: { nama: true } },
      location: { select: { nama: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Status Unit</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitoring posisi dan kesiapan unit secara operasional.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(unit) => unit.id}
          getTitle={(unit) => unit.kodeLambung}
          emptyMessage="Tidak ada data status unit."
          columns={[
            { header: "Kode Lambung", className: "font-semibold text-gray-800 dark:text-white/90", render: (unit) => unit.kodeLambung },
            { header: "Kategori", className: "text-gray-600 dark:text-gray-400", render: (unit) => unit.category?.nama ?? "-" },
            { header: "Merk / Model", className: "text-gray-600 dark:text-gray-400", render: (unit) => `${unit.merk} ${unit.model}` },
            { header: "Lokasi", className: "text-gray-600 dark:text-gray-400", render: (unit) => unit.location?.nama ?? "-" },
            { header: "Status", render: (unit) => <Badge size="sm" color={statusColor(unit.status)}>{unit.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
