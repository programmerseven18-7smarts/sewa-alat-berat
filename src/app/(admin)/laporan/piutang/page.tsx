import type { Metadata } from "next";
import getDb from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan Piutang | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function LaporanPiutangPage() {
  const sql = getDb();
  const data = await sql`
    SELECT
      inv.no_invoice, c.nama AS customer_nama, inv.tanggal, inv.jatuh_tempo,
      inv.total,
      COALESCE(SUM(p.jumlah), 0) AS terbayar,
      inv.total - COALESCE(SUM(p.jumlah), 0) AS sisa,
      inv.status,
      NOW()::date - inv.jatuh_tempo::date AS hari_jatuh_tempo
    FROM invoices inv
    JOIN customers c ON inv.customer_id = c.id
    LEFT JOIN payments p ON p.invoice_id = inv.id
    WHERE inv.status != 'Lunas'
    GROUP BY inv.id, c.nama
    ORDER BY inv.jatuh_tempo ASC NULLS LAST
  `;

  const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
    if (s === "Jatuh Tempo") return "error";
    if (s === "Sebagian") return "warning";
    return "info";
  };

  const totalPiutang = (data as Record<string, unknown>[]).reduce((sum, r) => sum + Number(r.sisa), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Piutang</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Daftar invoice yang belum terbayar</p>
      </div>
      <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-sm text-error-700 dark:text-error-400">
          Total piutang outstanding: <span className="font-bold text-error-800 dark:text-error-300">{formatRupiah(totalPiutang)}</span>
          {" "}dari <span className="font-semibold">{data.length}</span> invoice belum lunas
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                {["No. Invoice", "Customer", "Tgl Invoice", "Jatuh Tempo", "Total", "Terbayar", "Sisa", "Umur (hari)", "Status"].map(h => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(data as Record<string, unknown>[]).map((r) => (
                <TableRow key={String(r.no_invoice)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-brand-600 dark:text-brand-400 text-theme-sm whitespace-nowrap">{String(r.no_invoice)}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 dark:text-white/90 text-theme-sm whitespace-nowrap">{String(r.customer_nama)}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-theme-sm whitespace-nowrap">{formatDate(String(r.tanggal))}</TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-theme-sm font-medium ${Number(r.hari_jatuh_tempo) > 0 ? "text-error-600" : "text-gray-500 dark:text-gray-400"}`}>
                      {r.jatuh_tempo ? formatDate(String(r.jatuh_tempo)) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total))}</TableCell>
                  <TableCell className="py-3 px-4 text-success-600 font-medium text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.terbayar))}</TableCell>
                  <TableCell className="py-3 px-4 font-bold text-error-600 dark:text-error-400 text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.sisa))}</TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {Number(r.hari_jatuh_tempo) > 0
                      ? <span className="text-error-600 font-semibold text-sm">{String(r.hari_jatuh_tempo)} hari</span>
                      : <span className="text-gray-400 text-sm">-</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4"><Badge size="sm" color={statusColor(String(r.status))}>{String(r.status)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
