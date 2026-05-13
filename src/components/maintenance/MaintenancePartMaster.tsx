"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatRupiah } from "@/lib/utils";
import {
  createMaintenancePartAction,
  deleteMaintenancePartAction,
  updateMaintenancePartAction,
} from "@/lib/maintenance/actions";

type MaintenanceOption = {
  id: number;
  label: string;
};

export type MaintenancePartRow = {
  id: number;
  maintenanceOrderId: number;
  workOrderNo: string;
  sparepartId: number | null;
  sparepartLabel: string | null;
  namaPart: string;
  supplierNama: string | null;
  harga: number;
  qty: number;
  satuan: string | null;
  total: number;
  fotoUrl: string | null;
};

type MaintenancePartMasterProps = {
  data: MaintenancePartRow[];
  workOrders: MaintenanceOption[];
  spareparts: MaintenanceOption[];
};

export default function MaintenancePartMaster({
  data,
  workOrders,
  spareparts,
}: MaintenancePartMasterProps) {
  const summary = useMemo(() => {
    return {
      totalPart: data.length,
      totalBiaya: data.reduce((sum, item) => sum + item.total, 0),
      linkedSparepart: data.filter((item) => item.sparepartId).length,
    };
  }, [data]);

  const workOrderOptions = workOrders.map((order) => ({
    value: String(order.id),
    label: order.label,
  }));
  const sparepartOptions = spareparts.map((part) => ({
    value: String(part.id),
    label: part.label,
  }));

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Detail Part</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.totalPart}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Terhubung Sparepart</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.linkedSparepart}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Biaya Part</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(summary.totalBiaya)}</p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Detail Part Maintenance"
        description="Rincian sparepart dan biaya per work order. Total WO ikut diperbarui dari detail ini."
        addLabel="Tambah Detail Part"
        searchPlaceholder="Cari WO, part, supplier, atau satuan..."
        data={data}
        searchFields={["workOrderNo", "namaPart", "sparepartLabel", "supplierNama", "satuan"]}
        getItemName={(item) => `${item.workOrderNo} - ${item.namaPart}`}
        fields={[
          {
            name: "maintenanceOrderId",
            label: "Work Order",
            type: "select",
            placeholder: "Pilih work order",
            options: workOrderOptions,
          },
          {
            name: "sparepartId",
            label: "Sparepart",
            type: "select",
            placeholder: "Pilih sparepart",
            options: sparepartOptions,
          },
          { name: "namaPart", label: "Nama Part", placeholder: "Nama sparepart / jasa" },
          { name: "supplierNama", label: "Supplier", placeholder: "Supplier / bengkel" },
          { name: "harga", label: "Harga", type: "number", placeholder: "0" },
          { name: "qty", label: "Qty", type: "number", placeholder: "1" },
          { name: "satuan", label: "Satuan", placeholder: "pcs / set / lot" },
          { name: "fotoUrl", label: "URL Foto", placeholder: "https://...", colSpan: "full" },
        ]}
        columns={[
          {
            header: "Work Order",
            className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
            render: (item) => item.workOrderNo,
          },
          {
            header: "Part",
            className: "min-w-[180px] font-medium text-gray-800 dark:text-white/90",
            render: (item) => item.namaPart,
          },
          {
            header: "Supplier",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.supplierNama || "-",
          },
          {
            header: "Harga",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatRupiah(item.harga),
          },
          {
            header: "Qty",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => `${item.qty.toLocaleString("id-ID")} ${item.satuan || ""}`,
          },
          {
            header: "Total",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.total),
          },
          {
            header: "Sparepart",
            className: "min-w-[180px] text-gray-500 dark:text-gray-400",
            render: (item) => item.sparepartLabel || "-",
          },
        ]}
        createAction={createMaintenancePartAction}
        updateAction={updateMaintenancePartAction}
        deleteAction={deleteMaintenancePartAction}
      />
    </div>
  );
}
