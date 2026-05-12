"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/db";

interface JadwalUnit {
  id: number;
  kode_lambung: string;
  merk: string;
  model: string;
  status: string;
  kategori: string;
  last_hm_service: number | null;
  last_service_date: string | null;
  last_tipe: string | null;
  current_hm: number | null;
}

function getServiceStatus(unit: JadwalUnit): { label: string; color: "success" | "warning" | "error" | "info"; hm_until: number | null } {
  if (!unit.current_hm) return { label: "HM Belum Ada", color: "info", hm_until: null };
  if (!unit.last_hm_service) return { label: "Belum Pernah Service", color: "error", hm_until: null };
  const nextService = Number(unit.last_hm_service) + 250;
  const hmUntil = nextService - Number(unit.current_hm);
  if (hmUntil <= 0) return { label: "Jatuh Tempo", color: "error", hm_until: hmUntil };
  if (hmUntil <= 50) return { label: "Segera Service", color: "warning", hm_until: hmUntil };
  return { label: "Normal", color: "success", hm_until: hmUntil };
}

export default function JadwalClient() {
  const [data, setData] = useState<JadwalUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maintenance/jadwal").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Jadwal Service / Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pantau jadwal service berkala berdasarkan HM (Hour Meter) unit</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Jatuh Tempo", color: "bg-error-50 border-error-200 dark:border-error-800 dark:bg-error-900/20 text-error-700 dark:text-error-400", filter: (u: JadwalUnit) => getServiceStatus(u).color === "error" },
          { label: "Segera Service", color: "bg-warning-50 border-warning-200 dark:border-warning-800 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400", filter: (u: JadwalUnit) => getServiceStatus(u).color === "warning" },
          { label: "Normal", color: "bg-success-50 border-success-200 dark:border-success-800 dark:bg-success-900/20 text-success-700 dark:text-success-400", filter: (u: JadwalUnit) => getServiceStatus(u).color === "success" },
        ].map(({ label, color, filter }) => (
          <div key={label} className={`rounded-2xl border px-5 py-4 ${color}`}>
            <p className="text-xs font-medium opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-bold">{data.filter(filter).length} unit</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                {["Unit", "Kategori", "Status Unit", "HM Terakhir", "Tgl Service Terakhir", "HM Saat Ini", "HM Service Berikutnya", "Sisa HM", "Jadwal"].map((h) => (
                  <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={9}>Memuat data...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell className="py-8 text-center text-gray-400" colSpan={9}>Tidak ada data unit</TableCell></TableRow>
              ) : data.map((u) => {
                const svc = getServiceStatus(u);
                const nextServiceHM = u.last_hm_service ? Number(u.last_hm_service) + 250 : null;
                const unitStatusColor = (s: string): "success" | "warning" | "error" | "info" => {
                  if (s === "On Duty") return "success";
                  if (s === "Stand By") return "info";
                  if (s === "Break Down") return "error";
                  return "warning";
                };
                return (
                  <TableRow key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3 px-4">
                      <p className="font-semibold text-gray-800 dark:text-white/90 text-theme-sm">{u.kode_lambung}</p>
                      <p className="text-xs text-gray-400">{u.merk} {u.model}</p>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400">{u.kategori || "-"}</TableCell>
                    <TableCell className="py-3 px-4"><Badge size="sm" color={unitStatusColor(u.status)}>{u.status}</Badge></TableCell>
                    <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 font-mono">{u.last_hm_service != null ? `${u.last_hm_service} HM` : "-"}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">{u.last_service_date ? formatDate(u.last_service_date) : "-"}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-800 font-semibold dark:text-white/90 text-theme-sm font-mono">{u.current_hm != null ? `${u.current_hm} HM` : "-"}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-500 text-theme-sm dark:text-gray-400 font-mono">{nextServiceHM != null ? `${nextServiceHM} HM` : "-"}</TableCell>
                    <TableCell className="py-3 px-4 font-mono text-theme-sm">
                      {svc.hm_until != null ? (
                        <span className={svc.hm_until <= 0 ? "text-error-600 font-bold" : svc.hm_until <= 50 ? "text-warning-600 font-semibold" : "text-success-600"}>
                          {svc.hm_until <= 0 ? `${Math.abs(svc.hm_until)} HM lewat` : `${svc.hm_until} HM`}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className="py-3 px-4"><Badge size="sm" color={svc.color}>{svc.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} unit terpantau</p>
        </div>
      </div>
    </div>
  );
}
