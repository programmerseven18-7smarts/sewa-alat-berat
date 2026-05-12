"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Penawaran {
  id: number;
  no_penawaran: string;
  customer_nama: string;
  tanggal: string;
  berlaku_hingga: string;
  unit_kode: string;
  merk: string;
  model: string;
  tarif: number;
  satuan: string;
  estimasi_total: number;
  status: string;
}

const STATUS_OPTIONS = ["", "Draft", "Terkirim", "Disetujui", "Ditolak", "Expired"];
const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "Disetujui") return "success";
  if (s === "Terkirim") return "info";
  if (s === "Ditolak" || s === "Expired") return "error";
  return "warning";
};

export default function PenawaranClient() {
  const [data, setData] = useState<Penawaran[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sewa/penawaran?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
    setData(await res.json());
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Penawaran Harga</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manajemen penawaran harga sewa alat berat ke customer</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Buat Penawaran
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input type="text" placeholder="Cari no. penawaran atau customer..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "Semua Status"}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["No. Penawaran", "Customer", "Tgl Penawaran", "Berlaku Hingga", "Unit", "Tarif", "Estimasi Total", "Status", "Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={9}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 text-center" colSpan={9}>
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-10 opacity-30"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5V9h5.5L13 3.5zM8 17v-2h8v2H8zm0-4v-2h8v2H8z"/></svg>
                      <p className="text-sm">Belum ada penawaran</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-brand-600 text-theme-sm dark:text-brand-400 whitespace-nowrap">{p.no_penawaran}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{p.customer_nama}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(p.tanggal)}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{p.berlaku_hingga ? formatDate(p.berlaku_hingga) : "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {p.unit_kode ? <><span className="font-medium">{p.unit_kode}</span><br /><span className="text-xs">{p.merk} {p.model}</span></> : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(p.tarif))}/{p.satuan}</TableCell>
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{formatRupiah(Number(p.estimasi_total))}</TableCell>
                  <TableCell className="py-3 px-4"><Badge size="sm" color={statusColor(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10" title="Edit">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button className="rounded p-1 text-gray-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10" title="Setujui">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} penawaran ditemukan</p>
        </div>
      </div>
    </div>
  );
}
