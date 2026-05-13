import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { canUserAccess } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rekap Kontrak | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function RekapKontrakPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");
  if (!canUserAccess(user, "laporan_kontrak", "view") && !canUserAccess(user, "kontrak_sewa", "view")) {
    notFound();
  }

  const customers = await prisma.customer.findMany({
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      rentalContracts: {
        select: {
          status: true,
          nilaiKontrak: true,
          dp: true,
        },
      },
    },
  });

  const rows = customers
    .map((customer) => ({
      id: customer.id,
      nama: customer.nama,
      totalKontrak: customer.rentalContracts.length,
      kontrakAktif: customer.rentalContracts.filter((contract) => contract.status === "Aktif").length,
      kontrakSelesai: customer.rentalContracts.filter((contract) => contract.status === "Selesai").length,
      totalNilai: customer.rentalContracts.reduce((sum, contract) => sum + Number(contract.nilaiKontrak), 0),
      totalDp: customer.rentalContracts.reduce((sum, contract) => sum + Number(contract.dp), 0),
    }))
    .filter((customer) => customer.totalKontrak > 0)
    .sort((a, b) => b.totalNilai - a.totalNilai);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Rekap Kontrak per Customer</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan total kontrak dan nilai bisnis per customer.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.id}
          getTitle={(row) => row.nama}
          emptyMessage="Belum ada data kontrak."
          columns={[
            { header: "Customer", className: "font-semibold text-gray-800 dark:text-white/90", render: (row) => row.nama },
            { header: "Total Kontrak", className: "text-center text-gray-500 dark:text-gray-400", render: (row) => row.totalKontrak },
            { header: "Aktif", className: "text-center", render: (row) => row.kontrakAktif > 0 ? <Badge size="sm" color="success">{row.kontrakAktif}</Badge> : <span className="text-sm text-gray-400">0</span> },
            { header: "Selesai", className: "text-center text-gray-500 dark:text-gray-400", render: (row) => row.kontrakSelesai },
            { header: "Total Nilai Kontrak", className: "font-bold text-gray-800 dark:text-white/90", render: (row) => formatRupiah(row.totalNilai) },
            { header: "Total DP", className: "text-gray-500 dark:text-gray-400", render: (row) => formatRupiah(row.totalDp) },
          ]}
        />
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-400">{rows.length} customer dengan kontrak</p>
        </div>
      </div>
    </div>
  );
}
