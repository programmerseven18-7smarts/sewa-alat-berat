import type { Metadata } from "next";
import getDb from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap Kontrak | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function RekapKontrakPage() {
  const sql = getDb();
  const data = await sql`
    SELECT
      c.nama AS customer_nama,
      COUNT(rc.id) AS total_kontrak,
      COUNT(rc.id) FILTER (WHERE rc.status = 'Aktif') AS kontrak_aktif,
      COUNT(rc.id) FILTER (WHERE rc.status = 'Selesai') AS kontrak_selesai,
      COALESCE(SUM(rc.nilai_kontrak), 0) AS total_nilai,
      COALESCE(SUM(rc.dp), 0) AS total_dp
    FROM customers c
    LEFT JOIN rental_contracts rc ON rc.customer_id = c.id
    GROUP BY c.id, c.nama
    HAVING COUNT(rc.id) > 0
    ORDER BY total_nilai DESC
  `;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Rekap Kontrak per Customer</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan total kontrak dan nilai bisnis per customer</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Customer", "Total Kontrak", "Aktif", "Selesai", "Total Nilai Kontrak", "Total DP"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(data as Record<string, unknown>[]).map((r) => (
                <TableRow key={String(r.customer_nama)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{String(r.customer_nama)}</TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{String(r.total_kontrak)}</TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {Number(r.kontrak_aktif) > 0
                      ? <Badge size="sm" color="success">{String(r.kontrak_aktif)}</Badge>
                      : <span className="text-gray-400 text-sm">0</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{String(r.kontrak_selesai)}</TableCell>
                  <TableCell className="py-3 px-4 font-bold text-gray-800 dark:text-white/90 text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total_nilai))}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(r.total_dp))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} customer dengan kontrak</p>
        </div>
      </div>
    </div>
  );
}
