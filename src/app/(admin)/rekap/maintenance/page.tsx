import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { canUserAccess } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rekap Maintenance | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function RekapMaintenancePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");
  if (
    !canUserAccess(user, "laporan_maintenance", "view") &&
    !canUserAccess(user, "biaya_maintenance", "view") &&
    !canUserAccess(user, "riwayat_maintenance", "view")
  ) {
    notFound();
  }

  const units = await prisma.equipmentUnit.findMany({
    orderBy: { kodeLambung: "asc" },
    select: {
      id: true,
      kodeLambung: true,
      merk: true,
      model: true,
      category: {
        select: {
          nama: true,
        },
      },
      maintenanceOrders: {
        select: {
          id: true,
          status: true,
          totalBiaya: true,
        },
      },
    },
  });

  const rows = units
    .map((unit) => {
      const totalBiaya = unit.maintenanceOrders.reduce((sum, order) => sum + Number(order.totalBiaya), 0);
      return {
        id: unit.id,
        kodeLambung: unit.kodeLambung,
        merk: unit.merk,
        model: unit.model,
        kategori: unit.category?.nama ?? "-",
        totalWo: unit.maintenanceOrders.length,
        woAktif: unit.maintenanceOrders.filter((order) => order.status === "Open" || order.status === "In Progress").length,
        woSelesai: unit.maintenanceOrders.filter((order) => order.status === "Done").length,
        totalBiaya,
      };
    })
    .sort((a, b) => b.totalBiaya - a.totalBiaya);

  const totalBiaya = rows.reduce((sum, row) => sum + row.totalBiaya, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Rekap Biaya Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ringkasan biaya dan riwayat maintenance per unit alat berat.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-xs text-gray-500 dark:text-gray-400">Total Biaya Maintenance</p>
        <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(totalBiaya)}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.id}
          getTitle={(row) => `${row.kodeLambung} - ${row.merk} ${row.model}`}
          emptyMessage="Tidak ada data rekap maintenance."
          columns={[
            {
              header: "Unit",
              render: (row) => (
                <>
                  <p className="font-semibold text-gray-800 dark:text-white/90">{row.kodeLambung}</p>
                  <p className="text-xs text-gray-400">{row.merk} {row.model}</p>
                </>
              ),
            },
            { header: "Kategori", className: "text-gray-500 dark:text-gray-400", render: (row) => row.kategori },
            { header: "Total WO", className: "text-gray-500 dark:text-gray-400", render: (row) => row.totalWo },
            { header: "WO Aktif", render: (row) => row.woAktif > 0 ? <Badge size="sm" color="warning">{row.woAktif}</Badge> : <span className="text-sm text-gray-400">0</span> },
            { header: "WO Selesai", className: "font-medium text-success-600", render: (row) => row.woSelesai },
            { header: "Total Biaya Maintenance", className: "font-bold text-gray-800 dark:text-white/90", render: (row) => formatRupiah(row.totalBiaya) },
          ]}
        />
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-400">{rows.length} unit</p>
        </div>
      </div>
    </div>
  );
}
