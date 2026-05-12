import type { Metadata } from "next";
import sql from "@/lib/db";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
export const metadata: Metadata = { title: "Lokasi Proyek | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function LokasiPage() {
  const data = await sql`SELECT * FROM project_locations ORDER BY kode`;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Lokasi Proyek</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Daftar lokasi proyek dan penempatan alat berat</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              {["Kode","Nama Lokasi","Kota","Provinsi","PIC","Telepon PIC"].map(h => (
                <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((r: any) => (
              <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="py-3 px-4 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{r.kode}</TableCell>
                <TableCell className="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{r.nama}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.kota || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.provinsi || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.pic_nama || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.pic_telepon || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
