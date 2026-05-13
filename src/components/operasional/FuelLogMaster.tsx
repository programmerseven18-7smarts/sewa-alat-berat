"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createFuelLogAction,
  deleteFuelLogAction,
  updateFuelLogAction,
} from "@/lib/operasional/actions";
import type { OperationalOption } from "@/components/operasional/DailyReportMaster";

export type FuelLogRow = {
  id: number;
  unitId: number;
  unitLabel: string;
  contractId: number | null;
  contractNo: string | null;
  tanggal: string;
  liter: number;
  hargaPerLiter: number;
  total: number;
  supplier: string | null;
  catatan: string | null;
};

type FuelLogMasterProps = {
  data: FuelLogRow[];
  units: OperationalOption[];
  contracts: OperationalOption[];
};

export default function FuelLogMaster({
  data,
  units,
  contracts,
}: FuelLogMasterProps) {
  const summary = useMemo(() => {
    return {
      totalLiter: data.reduce((sum, item) => sum + item.liter, 0),
      totalBiaya: data.reduce((sum, item) => sum + item.total, 0),
    };
  }, [data]);

  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const contractOptions = contracts.map((contract) => ({
    value: String(contract.id),
    label: contract.label,
  }));

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Liter</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.totalLiter.toLocaleString("id-ID")} L</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Biaya BBM</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(summary.totalBiaya)}</p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Konsumsi BBM"
        description="Pencatatan konsumsi bahan bakar seluruh unit alat berat."
        addLabel="Catat BBM"
        searchPlaceholder="Cari unit, kontrak, supplier, atau catatan..."
        data={data}
        searchFields={["unitLabel", "contractNo", "supplier", "catatan"]}
        getItemName={(item) => `${item.unitLabel} - ${formatDate(item.tanggal)}`}
        fields={[
          {
            name: "unitId",
            label: "Unit",
            type: "select",
            placeholder: "Pilih unit",
            options: unitOptions,
          },
          {
            name: "contractId",
            label: "Kontrak",
            type: "select",
            placeholder: "Pilih kontrak",
            options: contractOptions,
          },
          { name: "tanggal", label: "Tanggal", type: "date" },
          { name: "liter", label: "Liter", type: "number", placeholder: "100" },
          { name: "hargaPerLiter", label: "Harga / Liter", type: "number", placeholder: "15000" },
          { name: "supplier", label: "Supplier", placeholder: "SPBU / pemasok" },
          { name: "catatan", label: "Catatan", placeholder: "Catatan BBM", colSpan: "full" },
        ]}
        columns={[
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Unit",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => item.unitLabel,
          },
          {
            header: "Liter",
            className: "font-medium text-gray-800 dark:text-white/90",
            render: (item) => `${item.liter.toLocaleString("id-ID")} L`,
          },
          {
            header: "Harga/Liter",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => formatRupiah(item.hargaPerLiter),
          },
          {
            header: "Total",
            className: "font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.total),
          },
          {
            header: "Supplier",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.supplier || "-",
          },
          {
            header: "Catatan",
            className: "max-w-[200px] truncate text-xs text-gray-400",
            render: (item) => item.catatan || "-",
          },
        ]}
        createAction={createFuelLogAction}
        updateAction={updateFuelLogAction}
        deleteAction={deleteFuelLogAction}
      />
    </div>
  );
}
