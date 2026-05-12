"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/db";

interface Mobilisasi {
  id: number;
  no_mobilisasi: string;
  kode_lambung: string;
  merk: string;
  model: string;
  driver_nama: string;
  no_kontrak: string;
  asal_lokasi: string;
  tujuan_lokasi: string;
  tanggal_berangkat: string;
  tanggal_tiba: string;
  biaya_mobilisasi: number;
  biaya_demobilisasi: number;
  status: string;
}

const STATUS_OPTIONS = ["","Direncanakan","Dalam Perjalanan","Selesai","Dibatalkan"];
const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "Selesai") return "success";
  if (s === "Dalam Perjalanan") return "warning";
  if (s === "Dibatalkan") return "error";
  return "info";
};

export default function MobilisasiClient() {
  const [data, setData] = useState<Mobilisasi[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/mobilisasi?search=${encodeURIComponent(search)}`);
    setData(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Mobilisasi Alat Berat</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitoring pergerakan dan mobilisasi unit alat berat</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Buat Order Mobilisasi
        </button>
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" placeholder="Cari no. mobilisasi atau unit..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["No. Mobilisasi","Unit","Driver","Asal","Tujuan","Tgl Berangkat","Tgl Tiba","Biaya Mob.","Status","Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={10}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={10}>Tidak ada data</TableCell></TableRow>
              ) : data.map((m) => (
                <TableRow key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-brand-600 text-theme-sm dark:text-brand-400 whitespace-nowrap">{m.no_mobilisasi}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{m.kode_lambung}<br/><span className="text-xs text-gray-400">{m.merk} {m.model}</span></TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{m.driver_nama || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-xs dark:text-gray-400 max-w-[130px] truncate">{m.asal_lokasi}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-xs dark:text-gray-400 max-w-[130px] truncate">{m.tujuan_lokasi}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(m.tanggal_berangkat)}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{m.tanggal_tiba ? formatDate(m.tanggal_tiba) : <span className="text-warning-500">Dalam perjalanan</span>}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(m.biaya_mobilisasi))}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge size="sm" color={statusColor(m.status)}>{m.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} mobilisasi ditemukan</p>
        </div>
      </div>
    </div>
  );
}
