"use client";
import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/utils";

interface FuelLog {
  id: number;
  unit_kode: string;
  merk: string;
  model: string;
  tanggal: string;
  liter: number;
  harga_per_liter: number;
  total: number;
  supplier: string;
  catatan: string;
}

export default function BBMClient() {
  const [data, setData] = useState<FuelLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/operasional/bbm?search=${encodeURIComponent(search)}`);
    setData(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalLiter = data.reduce((s, r) => s + Number(r.liter), 0);
  const totalBiaya = data.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Konsumsi BBM</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pencatatan konsumsi bahan bakar seluruh unit alat berat</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Catat BBM
        </button>
      </div>

      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Liter</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{totalLiter.toLocaleString("id-ID")} L</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Biaya BBM</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(totalBiaya)}</p>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" placeholder="Cari unit..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Tanggal", "Unit", "Liter", "Harga/Liter", "Total", "Supplier", "Catatan"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={7}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-10 opacity-30"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z"/></svg>
                      <p className="text-sm">Belum ada data BBM</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(r.tanggal)}</TableCell>
                  <TableCell className="py-3 px-4">
                    <p className="font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{r.unit_kode}</p>
                    <p className="text-xs text-gray-400">{r.merk} {r.model}</p>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 font-medium text-theme-sm dark:text-white/90">{Number(r.liter).toLocaleString("id-ID")} L</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{formatRupiah(Number(r.harga_per_liter))}</TableCell>
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{formatRupiah(Number(r.total))}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{r.supplier || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-400 text-xs max-w-[180px] truncate">{r.catatan || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} catatan BBM</p>
        </div>
      </div>
    </div>
  );
}
