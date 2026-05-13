import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Timesheet Operator | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function TimesheetPage() {
  await requirePageAccess("timesheet");

  const data = await prisma.dailyReport.findMany({
    orderBy: { tanggal: "desc" },
    select: {
      id: true,
      tanggal: true,
      jamKerja: true,
      fuelLiter: true,
      hmAwal: true,
      hmAkhir: true,
      aktivitas: true,
      unit: { select: { kodeLambung: true } },
      operator: { select: { nama: true } },
      contract: { select: { noKontrak: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Timesheet Operator</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Rekap jam kerja, HM, BBM, aktivitas, dan kendala harian operator.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(row) => row.id}
          getTitle={(row) => `${formatDate(row.tanggal)} - ${row.unit.kodeLambung}`}
          emptyMessage="Belum ada data timesheet."
          minWidth={980}
          columns={[
            { header: "Tanggal", className: "text-gray-600 dark:text-gray-400", render: (row) => formatDate(row.tanggal) },
            { header: "Kontrak", className: "font-semibold text-brand-600 dark:text-brand-400", render: (row) => row.contract?.noKontrak ?? "-" },
            { header: "Unit", className: "text-gray-800 dark:text-white/90", render: (row) => row.unit.kodeLambung },
            { header: "Operator", className: "text-gray-600 dark:text-gray-400", render: (row) => row.operator?.nama ?? "-" },
            { header: "Jam Kerja", className: "text-gray-600 dark:text-gray-400", render: (row) => `${Number(row.jamKerja)} jam` },
            { header: "Fuel", className: "text-gray-600 dark:text-gray-400", render: (row) => `${Number(row.fuelLiter)} liter` },
            { header: "HM Awal", className: "text-gray-600 dark:text-gray-400", render: (row) => row.hmAwal != null ? Number(row.hmAwal) : "-" },
            { header: "HM Akhir", className: "text-gray-600 dark:text-gray-400", render: (row) => row.hmAkhir != null ? Number(row.hmAkhir) : "-" },
            { header: "Aktivitas", className: "text-gray-500 dark:text-gray-400", render: (row) => row.aktivitas ?? "-" },
          ]}
        />
      </div>
    </div>
  );
}
