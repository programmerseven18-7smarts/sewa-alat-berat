"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createUnitSaleHppAction,
  deleteUnitSaleHppAction,
  updateUnitSaleHppAction,
} from "@/lib/penjualan-unit/actions";

type UnitOption = {
  id: number;
  label: string;
};

export type UnitSaleHppRow = {
  id: number;
  unitId: number;
  unitLabel: string;
  noLaporan: string;
  tanggal: string;
  hppPembelian: number;
  biayaPerbaikan: number;
  biayaMekanik: number;
  biayaCat: number;
  biayaLas: number;
  biayaKebersihan: number;
  totalHpp: number;
  hargaJual: number | null;
  labaRugi: number | null;
  catatan: string | null;
};

type UnitSaleHppMasterProps = {
  data: UnitSaleHppRow[];
  units: UnitOption[];
  mode: "hpp" | "sale";
};

export default function UnitSaleHppMaster({
  data,
  units,
  mode,
}: UnitSaleHppMasterProps) {
  const summary = useMemo(() => {
    return {
      totalHpp: data.reduce((sum, item) => sum + item.totalHpp, 0),
      totalHargaJual: data.reduce((sum, item) => sum + (item.hargaJual ?? 0), 0),
      totalLabaRugi: data.reduce((sum, item) => sum + (item.labaRugi ?? 0), 0),
      soldCount: data.filter((item) => item.hargaJual != null).length,
    };
  }, [data]);

  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const printBasePath = mode === "hpp" ? "/penjualan-unit/hpp" : "/penjualan-unit/penjualan";

  const fields = [
    { name: "noLaporan", label: "No. Laporan", placeholder: "HPP-001" },
    { name: "unitId", label: "Unit", type: "select" as const, placeholder: "Pilih unit", options: unitOptions },
    { name: "tanggal", label: "Tanggal", type: "date" as const },
    { name: "hppPembelian", label: "HPP Pembelian", type: "number" as const, placeholder: "0" },
    { name: "biayaPerbaikan", label: "Biaya Perbaikan", type: "number" as const, placeholder: "0" },
    { name: "biayaMekanik", label: "Biaya Mekanik", type: "number" as const, placeholder: "0" },
    { name: "biayaCat", label: "Biaya Cat", type: "number" as const, placeholder: "0" },
    { name: "biayaLas", label: "Biaya Las", type: "number" as const, placeholder: "0" },
    { name: "biayaKebersihan", label: "Biaya Kebersihan", type: "number" as const, placeholder: "0" },
    { name: "hargaJual", label: "Harga Jual", type: "number" as const, placeholder: "0" },
    { name: "catatan", label: "Catatan", placeholder: "Catatan penjualan / HPP", colSpan: "full" as const },
  ];

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Laporan</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total HPP</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(summary.totalHpp)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Harga Jual</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(summary.totalHargaJual)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Laba / Rugi</p>
            <p className={`mt-1 text-2xl font-bold ${summary.totalLabaRugi >= 0 ? "text-success-600" : "text-error-600"}`}>
              {formatRupiah(summary.totalLabaRugi)}
            </p>
          </div>
        </div>
      )}

      <MasterDataTable
        title={mode === "hpp" ? "Penjualan Unit / HPP" : "Penjualan Unit"}
        description={mode === "hpp" ? "Rekap HPP pembelian, perbaikan, dan estimasi laba rugi unit." : "Daftar unit yang disiapkan atau dicatat untuk penjualan."}
        addLabel={mode === "hpp" ? "Tambah Laporan HPP" : "Tambah Penjualan"}
        searchPlaceholder="Cari no laporan, unit, atau catatan..."
        data={data}
        searchFields={["noLaporan", "unitLabel", "catatan"]}
        getItemName={(item) => item.noLaporan}
        fields={fields}
        columns={[
          {
            header: "No. Laporan",
            className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
            render: (item) => item.noLaporan,
          },
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Unit",
            className: "min-w-[180px] font-medium text-gray-800 dark:text-white/90",
            render: (item) => item.unitLabel,
          },
          {
            header: "Total HPP",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.totalHpp),
          },
          {
            header: "Harga Jual",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.hargaJual != null ? formatRupiah(item.hargaJual) : "-",
          },
          {
            header: "Laba / Rugi",
            className: "whitespace-nowrap font-semibold",
            render: (item) => (
              <span className={(item.labaRugi ?? 0) >= 0 ? "text-success-600" : "text-error-600"}>
                {item.labaRugi != null ? formatRupiah(item.labaRugi) : "-"}
              </span>
            ),
          },
          {
            header: "Catatan",
            className: "max-w-[260px] truncate text-gray-500 dark:text-gray-400",
            render: (item) => item.catatan || "-",
          },
          {
            header: "Cetak",
            className: "whitespace-nowrap",
            render: (item) => (
              <a
                href={`${printBasePath}/${item.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cetak
              </a>
            ),
          },
        ]}
        createAction={createUnitSaleHppAction}
        updateAction={updateUnitSaleHppAction}
        deleteAction={deleteUnitSaleHppAction}
      />
    </div>
  );
}
