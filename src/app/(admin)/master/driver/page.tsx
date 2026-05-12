import type { Metadata } from "next";
import sql from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
export const metadata: Metadata = { title: "Master Driver | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const data = await sql`SELECT * FROM drivers ORDER BY nama`;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Master Driver</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola data driver untuk mobilisasi alat berat</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              {["Kode","Nama","No. KTP","Telepon","No. SIM","Status"].map(h => (
                <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((r: any) => (
              <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="py-3 px-4 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{r.kode}</TableCell>
                <TableCell className="py-3 px-4 font-medium text-gray-800 dark:text-white/90">{r.nama}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs font-mono">{r.no_ktp || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.telepon || "-"}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{r.no_sim || "-"}</TableCell>
                <TableCell className="py-3 px-4"><Badge size="sm" color={r.status === "Aktif" ? "success" : "warning"}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
