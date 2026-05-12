import type { Metadata } from "next";
import getDb from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap Maintenance | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function RekapMaintenancePage() {
  const sql = getDb();
  const data = await sql`
    SELECT
      eu.kode_lambung, eu.merk, eu.model,
      ec.nama AS kategori,
      COUNT(mo.id) AS total_wo,
      COUNT(mo.id) FILTER (WHERE mo.status IN ('Open','In Progress')) AS wo_aktif,
      COUNT(mo.id) FILTER (WHERE mo.status = 'Done') AS wo_selesai,
      COALESCE(SUM(mo.biaya_total), 0) AS total_biaya
    FROM equipment_units eu
    LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
    LEFT JOIN maintenance_orders mo ON mo.unit_id = eu.id
    GROUP BY eu.id, eu.kode_lambung, eu.merk, eu.model, ec.nama
    ORDER BY total_biaya DESC
  `;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Rekap Biaya Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan biaya dan riwayat maintenance per unit alat berat</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Unit", "Kategori", "Total WO", "WO Aktif", "WO Selesai", "Total Biaya Maintenance"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(data as Record<string, unknown>[]).map((r) => (
                <TableRow key={String(r.kode_lambung)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4">
                    <p className="font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{String(r.kode_lambung)}</p>
                    <p className="text-xs text-gray-400">{String(r.merk)} {String(r.model)}</p>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{String(r.kategori || "-")}</TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{String(r.total_wo)}</TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {Number(r.wo_aktif) > 0
                      ? <Badge size="sm" color="warning">{String(r.wo_aktif)}</Badge>
                      : <span className="text-gray-400 text-sm">0</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center text-success-600 font-medium text-theme-sm">{String(r.wo_selesai)}</TableCell>
                  <TableCell className="py-3 px-4 font-bold text-gray-800 dark:text-white/90 text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total_biaya))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} unit</p>
        </div>
      </div>
    </div>
  );
}
