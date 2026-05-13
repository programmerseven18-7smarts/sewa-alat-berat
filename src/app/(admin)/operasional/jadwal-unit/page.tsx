import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jadwal Unit | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function JadwalUnitPage() {
  await requirePageAccess("jadwal_unit");

  const data = await prisma.rentalContract.findMany({
    orderBy: { mulaiSewa: "desc" },
    select: {
      id: true,
      noKontrak: true,
      mulaiSewa: true,
      akhirSewa: true,
      status: true,
      customer: { select: { nama: true } },
      unit: { select: { kodeLambung: true, merk: true, model: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Jadwal Unit</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kalender sederhana kontrak aktif dan rencana pemakaian unit.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(contract) => contract.id}
          getTitle={(contract) => contract.noKontrak}
          emptyMessage="Tidak ada jadwal unit."
          columns={[
            { header: "No. Kontrak", className: "font-semibold text-brand-600 dark:text-brand-400", render: (contract) => contract.noKontrak },
            { header: "Customer", className: "font-medium text-gray-800 dark:text-white/90", render: (contract) => contract.customer.nama },
            { header: "Unit", className: "text-gray-600 dark:text-gray-400", render: (contract) => `${contract.unit.kodeLambung} - ${contract.unit.merk} ${contract.unit.model}` },
            { header: "Mulai", className: "text-gray-600 dark:text-gray-400", render: (contract) => formatDate(contract.mulaiSewa) },
            { header: "Selesai", className: "text-gray-600 dark:text-gray-400", render: (contract) => contract.akhirSewa ? formatDate(contract.akhirSewa) : "-" },
            { header: "Status", className: "text-gray-600 dark:text-gray-400", render: (contract) => contract.status },
          ]}
        />
      </div>
    </div>
  );
}
