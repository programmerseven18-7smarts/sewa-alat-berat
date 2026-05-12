"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/db";

interface Unit {
  id: number;
  kode_lambung: string;
  kategori_nama: string;
  merk: string;
  model: string;
  tahun: number;
  no_polisi: string;
  status: string;
  lokasi_nama: string;
  tarif_harian: number;
  tarif_bulanan: number;
}

const STATUS_OPTIONS = ["","Stand By","On Duty","Break Down","Maintenance","Mobilisasi"];
const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "On Duty") return "success";
  if (s === "Stand By") return "info";
  if (s === "Break Down") return "error";
  if (s === "Maintenance") return "warning";
  return "info";
};

export default function UnitClient() {
  const [data, setData] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/master/unit?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Unit Alat Berat</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Daftar dan kelola semua unit alat berat</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Tambah Unit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text" placeholder="Cari kode lambung, merk, model..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>
        <select
          value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "Semua Status"}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Kode Lambung","Kategori","Merk / Model","Tahun","No. Polisi","Tarif Harian","Lokasi","Status","Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-400" colSpan={9}>Memuat data...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-400" colSpan={9}>Tidak ada data</TableCell>
                </TableRow>
              ) : data.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">{u.kode_lambung}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{u.kategori_nama || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{u.merk} {u.model}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{u.tahun || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{u.no_polisi || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(u.tarif_harian))}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 max-w-[150px] truncate">{u.lokasi_nama || "-"}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge size="sm" color={statusColor(u.status)}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button className="rounded p-1 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} unit ditemukan</p>
        </div>
      </div>
    </div>
  );
}
