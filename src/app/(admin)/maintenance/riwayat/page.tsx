import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Riwayat Maintenance | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const statusColor = (status: string) => {
  if (status === "Done" || status === "Selesai") return "success";
  if (status === "Cancel" || status === "Batal") return "error";
  if (status === "In Progress") return "warning";
  return "info";
};

export default async function RiwayatMaintenancePage() {
  await requirePageAccess("riwayat_maintenance");

  const data = await prisma.maintenanceOrder.findMany({
    orderBy: [{ tanggalMulai: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      noWo: true,
      tipe: true,
      tanggalMulai: true,
      tanggalSelesai: true,
      hmService: true,
      deskripsi: true,
      mekanik: true,
      status: true,
      totalBiaya: true,
      unit: {
        select: {
          kodeLambung: true,
          merk: true,
          model: true,
        },
      },
      supplier: {
        select: {
          nama: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Riwayat Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Histori perawatan dan perbaikan unit alat berat.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={data}
          getKey={(order) => order.id}
          getTitle={(order) => order.noWo}
          emptyMessage="Belum ada riwayat maintenance."
          minWidth={960}
          columns={[
            { header: "No. WO", className: "font-semibold text-brand-600 dark:text-brand-400", render: (order) => order.noWo },
            {
              header: "Unit",
              className: "text-gray-800 dark:text-white/90",
              render: (order) => (
                <>
                  {order.unit.kodeLambung}
                  <span className="block text-xs text-gray-400">{order.unit.merk} {order.unit.model}</span>
                </>
              ),
            },
            { header: "Tipe", className: "text-gray-500 dark:text-gray-400", render: (order) => order.tipe },
            { header: "Tanggal", className: "text-gray-500 dark:text-gray-400", render: (order) => order.tanggalMulai ? formatDate(order.tanggalMulai) : "-" },
            { header: "HM", className: "font-mono text-gray-500 dark:text-gray-400", render: (order) => order.hmService != null ? `${Number(order.hmService)} HM` : "-" },
            { header: "Deskripsi", className: "text-gray-500 dark:text-gray-400", render: (order) => <span className="line-clamp-2">{order.deskripsi}</span> },
            { header: "Mekanik", className: "text-gray-500 dark:text-gray-400", render: (order) => order.mekanik || "-" },
            { header: "Supplier", className: "text-gray-500 dark:text-gray-400", render: (order) => order.supplier?.nama || "-" },
            { header: "Biaya", className: "font-semibold text-gray-800 dark:text-white/90", render: (order) => formatRupiah(Number(order.totalBiaya)) },
            { header: "Status", render: (order) => <Badge size="sm" color={statusColor(order.status)}>{order.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
