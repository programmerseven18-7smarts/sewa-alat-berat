"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import Badge from "@/components/ui/badge/Badge";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createMaintenanceOrderAction,
  deleteMaintenanceOrderAction,
  updateMaintenanceOrderAction,
} from "@/lib/maintenance/actions";

type MaintenanceOption = {
  id: number;
  label: string;
};

export type WorkOrderRow = {
  id: number;
  noWo: string;
  unitId: number;
  unitLabel: string;
  tipe: string;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  hmService: number | null;
  deskripsi: string;
  mekanik: string | null;
  supplierId: number | null;
  supplierName: string | null;
  status: string;
  totalBiaya: number;
  catatan: string | null;
  partCount: number;
};

type WorkOrderMasterProps = {
  data: WorkOrderRow[];
  units: MaintenanceOption[];
  suppliers: MaintenanceOption[];
};

const statusColor = (status: string) => {
  if (status === "Done") return "success";
  if (status === "In Progress") return "warning";
  if (status === "Cancel") return "error";
  return "info";
};

const typeColor = (type: string) => {
  if (type === "Corrective" || type === "Breakdown") return "error";
  if (type === "Preventive") return "warning";
  return "info";
};

export default function WorkOrderMaster({
  data,
  units,
  suppliers,
}: WorkOrderMasterProps) {
  const summary = useMemo(() => {
    return {
      open: data.filter((item) => item.status === "Open").length,
      progress: data.filter((item) => item.status === "In Progress").length,
      done: data.filter((item) => item.status === "Done").length,
      totalBiaya: data.reduce((sum, item) => sum + item.totalBiaya, 0),
    };
  }, [data]);

  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const supplierOptions = suppliers.map((supplier) => ({
    value: String(supplier.id),
    label: supplier.label,
  }));

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Open</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.open}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.progress}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.done}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Biaya</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(summary.totalBiaya)}</p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Work Order Maintenance"
        description="Kelola perawatan dan perbaikan unit alat berat."
        addLabel="Buat Work Order"
        searchPlaceholder="Cari no. WO, unit, tipe, deskripsi, mekanik, supplier, atau status..."
        data={data}
        searchFields={["noWo", "unitLabel", "tipe", "deskripsi", "mekanik", "supplierName", "status", "catatan"]}
        getItemName={(item) => item.noWo}
        fields={[
          { name: "noWo", label: "No. WO", placeholder: "WO-001" },
          { name: "unitId", label: "Unit", type: "select", placeholder: "Pilih unit", options: unitOptions },
          {
            name: "tipe",
            label: "Tipe",
            type: "select",
            placeholder: "Pilih tipe",
            options: [
              { value: "Rutin", label: "Rutin" },
              { value: "Preventive", label: "Preventive" },
              { value: "Corrective", label: "Corrective" },
              { value: "Breakdown", label: "Breakdown" },
            ],
          },
          { name: "tanggalMulai", label: "Tanggal Mulai", type: "date" },
          { name: "tanggalSelesai", label: "Tanggal Selesai", type: "date" },
          { name: "hmService", label: "HM Service", type: "number", placeholder: "1250" },
          { name: "mekanik", label: "Mekanik", placeholder: "Nama mekanik" },
          { name: "supplierId", label: "Supplier", type: "select", placeholder: "Pilih supplier", options: supplierOptions },
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "Pilih status",
            options: [
              { value: "Open", label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Done", label: "Done" },
              { value: "Cancel", label: "Cancel" },
            ],
          },
          { name: "totalBiaya", label: "Total Biaya", type: "number", placeholder: "0" },
          { name: "deskripsi", label: "Deskripsi", placeholder: "Keluhan / pekerjaan", colSpan: "full" },
          { name: "catatan", label: "Catatan", placeholder: "Catatan tambahan", colSpan: "full" },
        ]}
        columns={[
          {
            header: "No. WO",
            className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
            render: (item) => item.noWo,
          },
          {
            header: "Unit",
            className: "min-w-[170px] font-medium text-gray-800 dark:text-white/90",
            render: (item) => item.unitLabel,
          },
          {
            header: "Tipe",
            className: "whitespace-nowrap",
            render: (item) => (
              <Badge size="sm" color={typeColor(item.tipe)}>
                {item.tipe}
              </Badge>
            ),
          },
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.tanggalMulai ? formatDate(item.tanggalMulai) : "-",
          },
          {
            header: "HM",
            className: "whitespace-nowrap font-mono text-gray-500 dark:text-gray-400",
            render: (item) => item.hmService != null ? `${item.hmService} HM` : "-",
          },
          {
            header: "Mekanik",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.mekanik || "-",
          },
          {
            header: "Biaya",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.totalBiaya),
          },
          {
            header: "Part",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.partCount,
          },
          {
            header: "Status",
            className: "whitespace-nowrap",
            render: (item) => (
              <Badge size="sm" color={statusColor(item.status)}>
                {item.status}
              </Badge>
            ),
          },
          {
            header: "Cetak",
            className: "whitespace-nowrap",
            render: (item) => (
              <a
                href={`/maintenance/work-order/${item.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cetak
              </a>
            ),
          },
        ]}
        createAction={createMaintenanceOrderAction}
        updateAction={updateMaintenanceOrderAction}
        deleteAction={deleteMaintenanceOrderAction}
      />
    </div>
  );
}
