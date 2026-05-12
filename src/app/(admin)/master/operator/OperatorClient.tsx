"use client";
import { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

interface Operator {
  id: number;
  kode: string;
  nama: string;
  no_ktp: string;
  telepon: string;
  sim_type: string;
  sim_no: string;
  status: string;
  unit_kode: string;
  merk: string;
  model: string;
}

export default function OperatorClient() {
  const [data, setData] = useState<Operator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/master/operator?search=${encodeURIComponent(search)}`);
    setData(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Master Operator</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola data operator alat berat</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Tambah Operator
        </button>
      </div>
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" placeholder="Cari nama atau kode operator..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Kode","Nama","No. KTP","Telepon","SIM","Unit Ditugaskan","Status","Aksi"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={8}>Memuat data...</TableCell></TableRow>
              ) : data.map((o) => (
                <TableRow key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="py-3 px-4 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{o.kode}</TableCell>
                  <TableCell className="py-3 px-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">{o.nama}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 font-mono text-xs">{o.no_ktp || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{o.telepon || "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{o.sim_type ? `${o.sim_type} - ${o.sim_no}` : "-"}</TableCell>
                  <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{o.unit_kode ? `${o.unit_kode} (${o.merk} ${o.model})` : "-"}</TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge size="sm" color={o.status === "Aktif" ? "success" : "warning"}>{o.status}</Badge>
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
          <p className="text-sm text-gray-400">{data.length} operator ditemukan</p>
        </div>
      </div>
    </div>
  );
}
