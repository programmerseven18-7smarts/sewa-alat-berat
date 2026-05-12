import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
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
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {["No. Kontrak","Customer","Unit","Mulai Sewa","Nilai Kontrak","Status"].map((h) => (
                <TableCell key={h} isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row) => (
              <TableRow key={row.no_kontrak}>
                <TableCell className="py-3 text-gray-800 text-theme-sm font-medium dark:text-white/90 whitespace-nowrap">{row.no_kontrak}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{row.customer_nama}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{row.unit_kode}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(row.mulai_sewa)}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(row.nilai_kontrak))}</TableCell>
                <TableCell className="py-3">
                  <Badge size="sm" color={statusColor(row.status)}>{row.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
