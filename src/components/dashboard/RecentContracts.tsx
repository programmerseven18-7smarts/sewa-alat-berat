import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "../ui/badge/Badge";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Contract {
  no_kontrak: string;
  customer_nama: string;
  unit_kode: string;
  mulai_sewa: string;
  status: string;
  nilai_kontrak: string;
}

const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "Aktif") return "success";
  if (s === "Selesai") return "info";
  if (s === "Dibatalkan") return "error";
  return "warning";
};

export default function RecentContracts({ data }: { data: Contract[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Kontrak Terbaru</h3>
        <a href="/sewa/kontrak" className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
          Lihat Semua
        </a>
      </div>
      <ResponsiveDataView
        data={data}
        getKey={(row) => row.no_kontrak}
        getTitle={(row) => row.no_kontrak}
        emptyMessage="Belum ada kontrak."
        columns={[
          { header: "No. Kontrak", className: "font-medium text-gray-800 dark:text-white/90", render: (row) => row.no_kontrak },
          { header: "Customer", className: "text-gray-500 dark:text-gray-400", render: (row) => row.customer_nama },
          { header: "Unit", className: "text-gray-500 dark:text-gray-400", render: (row) => row.unit_kode },
          { header: "Mulai Sewa", className: "text-gray-500 dark:text-gray-400", render: (row) => formatDate(row.mulai_sewa) },
          { header: "Nilai Kontrak", className: "text-gray-500 dark:text-gray-400", render: (row) => formatRupiah(Number(row.nilai_kontrak)) },
          { header: "Status", render: (row) => <Badge size="sm" color={statusColor(row.status)}>{row.status}</Badge> },
        ]}
      />
    </div>
  );
}
