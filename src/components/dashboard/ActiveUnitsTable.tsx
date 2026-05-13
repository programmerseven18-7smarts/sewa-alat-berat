import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "../ui/badge/Badge";

interface Unit {
  kode_lambung: string;
  kategori: string;
  merk: string;
  model: string;
  status: string;
  lokasi: string;
}

const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "Stand By") return "success";
  if (s === "On Duty") return "info";
  if (s === "Break Down") return "error";
  if (s === "Maintenance") return "warning";
  return "info";
};

export default function ActiveUnitsTable({ data }: { data: Unit[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Status Unit Alat</h3>
        <a href="/master/unit" className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
          Kelola Unit
        </a>
      </div>
      <ResponsiveDataView
        data={data}
        getKey={(unit) => unit.kode_lambung}
        getTitle={(unit) => unit.kode_lambung}
        emptyMessage="Belum ada unit."
        columns={[
          { header: "Kode Lambung", className: "font-semibold text-gray-800 dark:text-white/90", render: (unit) => unit.kode_lambung },
          { header: "Kategori", className: "text-gray-500 dark:text-gray-400", render: (unit) => unit.kategori },
          { header: "Merk / Model", className: "text-gray-500 dark:text-gray-400", render: (unit) => `${unit.merk} ${unit.model}` },
          { header: "Lokasi", className: "text-gray-500 dark:text-gray-400", render: (unit) => unit.lokasi || "-" },
          { header: "Status", render: (unit) => <Badge size="sm" color={statusColor(unit.status)}>{unit.status}</Badge> },
        ]}
      />
    </div>
  );
}
