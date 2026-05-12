"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Pembayaran {
  id: number;
  no_pembayaran: string;
  no_invoice: string;
  customer_nama: string;
  tanggal: string;
  jumlah: number;
  metode: string;
  nama_bank: string;
  no_rekening: string;
}

const metodeColor = (m: string): "success" | "warning" | "error" | "info" => {
  if (m === "Transfer") return "success";
  if (m === "Tunai") return "info";
  if (m === "Giro") return "warning";
  return "info";
};

export default function PembayaranClient() {
  const [data, setData] = useState<Pembayaran[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/keuangan/pembayaran?search=${encodeURIComponent(search)}`);
    setData(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPenerimaan = data.reduce((s, p) => s + Number(p.jumlah), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Pembayaran</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rekap penerimaan pembayaran dari customer</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Input Pembayaran
        </button>
      </div>

      {!loading && data.length > 0 && (
        <div className="rounded-2xl border border-success-200 bg-success-50 px-5 py-4 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-sm text-success-700 dark:text-success-400">
            Total penerimaan (semua waktu): <span className="font-bold text-success-800 dark:text-success-300">{formatRupiah(totalPenerimaan)}</span>
            &nbsp;dari <span className="font-semibold">{data.length}</span> transaksi
          </p>
        </div>
      )}

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" placeholder="Cari no. pembayaran atau invoice..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["No. Pembayaran","No. Invoice","Customer","Tgl Bayar","Jumlah","Metode","Rekening Tujuan","Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={8}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={8}>Tidak ada data</TableCell></TableRow>
              ) : data.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-brand-600 text-theme-sm dark:text-brand-400 whitespace-nowrap">{p.no_pembayaran}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{p.no_invoice}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{p.customer_nama}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(p.tanggal)}</TableCell>
                  <TableCell className="py-3 px-4 font-bold text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{formatRupiah(Number(p.jumlah))}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge size="sm" color={metodeColor(p.metode)}>{p.metode}</Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-xs dark:text-gray-400">{p.nama_bank ? `${p.nama_bank} - ${p.no_rekening}` : "-"}</TableCell>
                  <TableCell className="py-3 px-4">
                    <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} pembayaran ditemukan</p>
        </div>
      </div>
    </div>
  );
}
