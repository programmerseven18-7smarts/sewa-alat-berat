"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate } from "@/lib/utils";
import {
  createDailyReportAction,
  deleteDailyReportAction,
  updateDailyReportAction,
} from "@/lib/operasional/actions";

export type OperationalOption = {
  id: number;
  label: string;
};

export type DailyReportRow = {
  id: number;
  contractId: number | null;
  contractNo: string | null;
  unitId: number;
  unitLabel: string;
  operatorId: number | null;
  operatorName: string | null;
  tanggal: string;
  jamKerja: number;
  fuelLiter: number;
  hmAwal: number | null;
  hmAkhir: number | null;
  aktivitas: string | null;
  kendala: string | null;
};

type DailyReportMasterProps = {
  data: DailyReportRow[];
  units: OperationalOption[];
  operators: OperationalOption[];
  contracts: OperationalOption[];
};

export default function DailyReportMaster({
  data,
  units,
  operators,
  contracts,
}: DailyReportMasterProps) {
  const summary = useMemo(() => {
    return {
      totalJamKerja: data.reduce((sum, item) => sum + item.jamKerja, 0),
      totalFuel: data.reduce((sum, item) => sum + item.fuelLiter, 0),
      unitCount: new Set(data.map((item) => item.unitId)).size,
    };
  }, [data]);

  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const operatorOptions = operators.map((operator) => ({
    value: String(operator.id),
    label: operator.label,
  }));
  const contractOptions = contracts.map((contract) => ({
    value: String(contract.id),
    label: contract.label,
  }));

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Laporan", value: String(data.length) },
            { label: "Total Jam Kerja", value: `${summary.totalJamKerja.toFixed(1)} jam` },
            { label: "Total BBM", value: `${summary.totalFuel.toFixed(1)} liter` },
            { label: "Unit Aktif", value: String(summary.unitCount) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
              <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <MasterDataTable
        title="Laporan Harian Operasional"
        description="Rekap aktivitas harian unit alat berat di lapangan."
        addLabel="Input Laporan"
        searchPlaceholder="Cari unit, operator, kontrak, aktivitas, atau kendala..."
        data={data}
        searchFields={["unitLabel", "operatorName", "contractNo", "aktivitas", "kendala"]}
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
            name: "operatorId",
            label: "Operator",
            type: "select",
            placeholder: "Pilih operator",
            options: operatorOptions,
          },
          {
            name: "contractId",
            label: "Kontrak",
            type: "select",
            placeholder: "Pilih kontrak",
            options: contractOptions,
          },
          { name: "tanggal", label: "Tanggal", type: "date" },
          { name: "jamKerja", label: "Jam Kerja", type: "number", placeholder: "8" },
          { name: "fuelLiter", label: "BBM (Liter)", type: "number", placeholder: "50" },
          { name: "hmAwal", label: "HM Awal", type: "number", placeholder: "1000" },
          { name: "hmAkhir", label: "HM Akhir", type: "number", placeholder: "1008" },
          { name: "aktivitas", label: "Aktivitas", placeholder: "Aktivitas lapangan", colSpan: "full" },
          { name: "kendala", label: "Kendala", placeholder: "Kendala operasional", colSpan: "full" },
        ]}
        columns={[
          {
            header: "Tanggal",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Unit",
            className: "whitespace-nowrap font-medium text-gray-800 dark:text-white/90",
            render: (item) => item.unitLabel,
          },
          {
            header: "Operator",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.operatorName || "-",
          },
          {
            header: "No. Kontrak",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.contractNo || "-",
          },
          {
            header: "Jam Kerja",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => `${item.jamKerja} jam`,
          },
          {
            header: "BBM (L)",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => `${item.fuelLiter} L`,
          },
          {
            header: "HM Awal",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.hmAwal ?? "-",
          },
          {
            header: "HM Akhir",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.hmAkhir ?? "-",
          },
          {
            header: "Aktivitas",
            className: "max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400",
            render: (item) => item.aktivitas || "-",
          },
          {
            header: "Kendala",
            className: "max-w-[180px] truncate text-xs text-gray-500 dark:text-gray-400",
            render: (item) => item.kendala || "-",
          },
        ]}
        createAction={createDailyReportAction}
        updateAction={updateDailyReportAction}
        deleteAction={deleteDailyReportAction}
      />
    </div>
  );
}
