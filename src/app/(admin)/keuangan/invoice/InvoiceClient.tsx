"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/db";

interface Invoice {
  id: number;
  no_invoice: string;
  customer_nama: string;
  no_kontrak: string;
  tanggal: string;
  jatuh_tempo: string;
  tipe: string;
  subtotal: number;
  pajak: number;
  total: number;
  status: string;
  nama_bank: string;
  no_rekening: string;
}

const STATUS_OPTIONS = ["","Belum Lunas","Lunas","Sebagian","Jatuh Tempo"];
const statusColor = (s: string): "success" | "warning" | "error" | "info" => {
  if (s === "Lunas") return "success";
  if (s === "Sebagian") return "warning";
  if (s === "Jatuh Tempo") return "error";
  return "info";
};

export default function InvoiceClient() {
  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/keuangan/invoice?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
    setData(await res.json());
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOutstanding = data.filter(i => i.status !== "Lunas").reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Daftar Invoice</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manajemen penagihan dan invoice sewa alat berat</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Buat Invoice
        </button>
      </div>

      {/* Summary card */}
      {!loading && data.length > 0 && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 dark:border-warning-800 dark:bg-warning-900/20">
          <p className="text-sm text-warning-700 dark:text-warning-400">
            Total piutang belum lunas: <span className="font-bold text-warning-800 dark:text-warning-300">{formatRupiah(totalOutstanding)}</span>
            &nbsp;dari <span className="font-semibold">{data.filter(i => i.status !== "Lunas").length}</span> invoice
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input type="text" placeholder="Cari no. invoice atau customer..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                {["No. Invoice","Customer","No. Kontrak","Tgl Invoice","Jatuh Tempo","Subtotal","Pajak","Total","Bank","Status","Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={11}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={11}>Tidak ada data</TableCell></TableRow>
              ) : data.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-semibold text-brand-600 text-theme-sm dark:text-brand-400 whitespace-nowrap">{inv.no_invoice}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{inv.customer_nama}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{inv.no_kontrak || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatDate(inv.tanggal)}</TableCell>
                  <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-theme-sm ${inv.status === "Jatuh Tempo" ? "text-error-600 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                      {inv.jatuh_tempo ? formatDate(inv.jatuh_tempo) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(inv.subtotal))}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{formatRupiah(Number(inv.pajak))}</TableCell>
                  <TableCell className="py-3 px-4 font-bold text-gray-800 text-theme-sm dark:text-white/90 whitespace-nowrap">{formatRupiah(Number(inv.total))}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-xs dark:text-gray-400">{inv.nama_bank || "-"}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge size="sm" color={statusColor(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10" title="Lihat">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                      </button>
                      <button className="rounded p-1 text-gray-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10" title="Tandai Lunas">
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
          <p className="text-sm text-gray-400">{data.length} invoice ditemukan</p>
        </div>
      </div>
    </div>
  );
}
