import Badge from "../ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

interface Unit {
  kode_lambung: string;
  kategori: string;
  merk: string;
  model: string;
  status: string;
  lokasi: string;
}

const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "On Duty") return "success";
  if (s === "Stand By") return "info";
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
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {["Kode Lambung","Kategori","Merk / Model","Lokasi","Status"].map((h) => (
                <TableCell key={h} isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((unit) => (
              <TableRow key={unit.kode_lambung}>
                <TableCell className="py-3 font-semibold text-gray-800 text-theme-sm dark:text-white/90">{unit.kode_lambung}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{unit.kategori}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{unit.merk} {unit.model}</TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 max-w-[180px] truncate">{unit.lokasi || "-"}</TableCell>
                <TableCell className="py-3">
                  <Badge size="sm" color={statusColor(unit.status)}>{unit.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
