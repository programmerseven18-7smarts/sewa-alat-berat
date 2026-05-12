"use client";
import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/db";

interface PendapatanRow {
  bulan: string;
  total_invoice: number;
  total_lunas: number;
  total_belum_lunas: number;
  jumlah_invoice: number;
  jumlah_kontrak: number;
}

const MONTHS: { value: string; label: string }[] = [
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
];

export default function LaporanPendapatanClient() {
  const [data, setData] = useState<PendapatanRow[]>([]);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/laporan/pendapatan?tahun=${encodeURIComponent(tahun)}`);
    setData(await res.json());
    setLoading(false);
  }, [tahun]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalTagihan = data.reduce((s, r) => s + Number(r.total_invoice), 0);
  const totalLunas = data.reduce((s, r) => s + Number(r.total_lunas), 0);
  const totalBelum = data.reduce((s, r) => s + Number(r.total_belum_lunas), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Pendapatan</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rekap pendapatan bulanan dari sewa alat berat</p>
        </div>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tagihan {tahun}</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(totalTagihan)}</p>
        </div>
        <div className="rounded-2xl border border-success-200 bg-success-50 px-5 py-4 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-xs text-success-700 dark:text-success-400">Sudah Lunas</p>
          <p className="mt-1 text-xl font-bold text-success-800 dark:text-success-300">{formatRupiah(totalLunas)}</p>
        </div>
        <div className="rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 dark:border-warning-800 dark:bg-warning-900/20">
          <p className="text-xs text-warning-700 dark:text-warning-400">Belum Lunas</p>
          <p className="mt-1 text-xl font-bold text-warning-800 dark:text-warning-300">{formatRupiah(totalBelum)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              {["Bulan", "Jml Invoice", "Jml Kontrak", "Total Tagihan", "Sudah Lunas", "Belum Lunas", "% Terbayar"].map((h) => (
                <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={7}>Memuat data...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={7}>Tidak ada data untuk tahun {tahun}</TableCell></TableRow>
            ) : data.map((r) => {
              const pct = Number(r.total_invoice) > 0 ? Math.round((Number(r.total_lunas) / Number(r.total_invoice)) * 100) : 0;
              return (
                <TableRow key={r.bulan} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{r.bulan}</TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{r.jumlah_invoice}</TableCell>
                  <TableCell className="py-3 px-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">{r.jumlah_kontrak}</TableCell>
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-white/90 text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total_invoice))}</TableCell>
                  <TableCell className="py-3 px-4 text-success-600 font-medium text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total_lunas))}</TableCell>
                  <TableCell className="py-3 px-4 text-warning-600 font-medium text-theme-sm whitespace-nowrap">{formatRupiah(Number(r.total_belum_lunas))}</TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800 h-1.5">
                        <div className="rounded-full h-1.5 bg-success-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-9 text-right">{pct}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
