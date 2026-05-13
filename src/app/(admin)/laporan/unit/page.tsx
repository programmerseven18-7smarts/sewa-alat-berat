import type { Metadata } from "next";
import Badge from "@/components/ui/badge/Badge";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Laporan Unit | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const statusColor = (status: string) => {
  if (status === "Stand By") return "success";
  if (status === "On Duty") return "info";
  if (status === "Break Down") return "error";
  return "warning";
};

export default async function LaporanUnitPage() {
  await requirePageAccess("laporan_utilisasi_unit");

  const data = await prisma.equipmentUnit.findMany({
    orderBy: { kodeLambung: "asc" },
    select: {
      id: true,
      kodeLambung: true,
      merk: true,
      model: true,
      status: true,
      category: { select: { nama: true } },
      location: { select: { nama: true } },
      rentalContracts: {
        select: {
          status: true,
          nilaiKontrak: true,
        },
      },
      maintenanceOrders: {
        where: {
          status: { in: ["Open", "In Progress"] },
        },
        select: { id: true },
      },
    },
  });

  const rows = data.map((unit) => ({
    id: unit.id,
    kodeLambung: unit.kodeLambung,
    merk: unit.merk,
    model: unit.model,
    status: unit.status,
    kategori: unit.category?.nama ?? "-",
    lokasi: unit.location?.nama ?? "-",
    kontrakAktif: unit.rentalContracts.filter((contract) => contract.status === "Aktif").length,
    kontrakSelesai: unit.rentalContracts.filter((contract) => contract.status === "Selesai").length,
    totalPendapatan: unit.rentalContracts
      .filter((contract) => contract.status === "Aktif" || contract.status === "Selesai")
      .reduce((sum, contract) => sum + Number(contract.nilaiKontrak), 0),
    woAktif: unit.maintenanceOrders.length,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Utilisasi Unit</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan performa dan utilisasi seluruh unit alat berat.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.id}
          getTitle={(row) => `${row.kodeLambung} - ${row.merk} ${row.model}`}
          emptyMessage="Tidak ada data unit."
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
            { header: "Status", render: (row) => <Badge size="sm" color={statusColor(row.status)}>{row.status}</Badge> },
            { header: "Lokasi", className: "text-gray-500 dark:text-gray-400", render: (row) => row.lokasi },
            { header: "Kontrak Aktif", className: "text-center font-semibold text-success-600", render: (row) => row.kontrakAktif },
            { header: "Kontrak Selesai", className: "text-center text-gray-500 dark:text-gray-400", render: (row) => row.kontrakSelesai },
            { header: "Total Pendapatan", className: "font-semibold text-gray-800 dark:text-white/90", render: (row) => formatRupiah(row.totalPendapatan) },
            {
              header: "WO Aktif",
              className: "text-center",
              render: (row) => row.woAktif > 0 ? <Badge size="sm" color="warning">{row.woAktif} WO</Badge> : <span className="text-xs text-gray-400">-</span>,
            },
          ]}
        />
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-400">{rows.length} unit</p>
        </div>
      </div>
    </div>
  );
}
