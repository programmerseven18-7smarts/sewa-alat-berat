import type { Metadata } from "next";
import sql from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/db";

export const metadata: Metadata = { title: "Laporan Unit | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function LaporanUnitPage() {
  const data = await sql`
    SELECT
      eu.kode_lambung, eu.merk, eu.model, eu.status,
      ec.nama AS kategori,
      pl.nama AS lokasi_saat_ini,
      COUNT(DISTINCT rc.id) FILTER (WHERE rc.status = 'Aktif') AS kontrak_aktif,
      COUNT(DISTINCT rc.id) FILTER (WHERE rc.status = 'Selesai') AS kontrak_selesai,
      COALESCE(SUM(rc.nilai_kontrak) FILTER (WHERE rc.status IN ('Aktif','Selesai')), 0) AS total_pendapatan,
      COUNT(DISTINCT mo.id) FILTER (WHERE mo.status IN ('Open','In Progress')) AS wo_aktif
    FROM equipment_units eu
    LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
    LEFT JOIN project_locations pl ON eu.location_id = pl.id
    LEFT JOIN rental_contracts rc ON rc.unit_id = eu.id
    LEFT JOIN maintenance_orders mo ON mo.unit_id = eu.id
    GROUP BY eu.id, eu.kode_lambung, eu.merk, eu.model, eu.status, ec.nama, pl.nama
    ORDER BY eu.kode_lambung
  `;

  const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
    if (s === "On Duty") return "success";
    if (s === "Stand By") return "info";
    if (s === "Break Down") return "error";
    return "warning";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Utilisasi Unit</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan performa dan utilisasi seluruh unit alat berat</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Unit", "Kategori", "Status", "Lokasi", "Kontrak Aktif", "Kontrak Selesai", "Total Pendapatan", "WO Aktif"].map(h => (
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
                  <TableCell className="py-3 px-4"><Badge size="sm" color={statusColor(String(r.status))}>{String(r.status)}</Badge></TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 max-w-[150px] truncate">{String(r.lokasi_saat_ini || "-")}</TableCell>
                  <TableCell className="py-3 px-4 text-center font-semibold text-success-600">{String(r.kontrak_aktif)}</TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{String(r.kontrak_selesai)}</TableCell>
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-white/90 whitespace-nowrap">{formatRupiah(Number(r.total_pendapatan))}</TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {Number(r.wo_aktif) > 0
                      ? <Badge size="sm" color="warning">{String(r.wo_aktif)} WO</Badge>
                      : <span className="text-xs text-gray-400">-</span>}
                  </TableCell>
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
