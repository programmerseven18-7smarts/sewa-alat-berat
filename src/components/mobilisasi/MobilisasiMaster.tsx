"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createMobilisasiAction,
  deleteMobilisasiAction,
  updateMobilisasiAction,
} from "@/lib/mobilisasi/actions";

export type MobilisasiOption = {
  id: number;
  label: string;
};

export type MobilisasiRow = {
  id: number;
  noMobilisasi: string;
  unitId: number;
  unitLabel: string;
  driverId: number | null;
  driverName: string | null;
  contractId: number | null;
  contractNo: string | null;
  asalLokasi: string;
  tujuanLokasi: string;
  tanggalBerangkat: string;
  tanggalTiba: string | null;
  biayaMobilisasi: number;
  biayaDemobilisasi: number;
  status: string;
  catatan: string | null;
  fotoBerangkatUrl: string | null;
  fotoTibaUrl: string | null;
  buktiTransferUrl: string | null;
};

type MobilisasiMasterProps = {
  data: MobilisasiRow[];
  units: MobilisasiOption[];
  drivers: MobilisasiOption[];
  contracts: MobilisasiOption[];
};

const statusOptions = [
  { value: "Direncanakan", label: "Direncanakan" },
  { value: "Dalam Perjalanan", label: "Dalam Perjalanan" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Dibatalkan" },
];

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Selesai") return "success";
  if (status === "Dalam Perjalanan") return "warning";
  if (status === "Dibatalkan") return "error";
  return "info";
};

export default function MobilisasiMaster({
  data,
  units,
  drivers,
  contracts,
}: MobilisasiMasterProps) {
  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const driverOptions = drivers.map((driver) => ({
    value: String(driver.id),
    label: driver.label,
  }));
  const contractOptions = contracts.map((contract) => ({
    value: String(contract.id),
    label: contract.label,
  }));

  return (
    <MasterDataTable
      title="Mobilisasi Alat Berat"
      description="Monitoring pergerakan dan mobilisasi unit alat berat."
      addLabel="Buat Order Mobilisasi"
      searchPlaceholder="Cari nomor, unit, driver, kontrak, asal, tujuan, atau status..."
      data={data}
      searchFields={["noMobilisasi", "unitLabel", "driverName", "contractNo", "asalLokasi", "tujuanLokasi", "status", "catatan"]}
      getItemName={(item) => item.noMobilisasi}
      fields={[
        { name: "noMobilisasi", label: "No. Mobilisasi", placeholder: "MOB-2026-0001" },
        {
          name: "unitId",
          label: "Unit",
          type: "select",
          placeholder: "Pilih unit",
          options: unitOptions,
        },
        {
          name: "driverId",
          label: "Driver",
          type: "select",
          placeholder: "Pilih driver",
          options: driverOptions,
        },
        {
          name: "contractId",
          label: "Kontrak",
          type: "select",
          placeholder: "Pilih kontrak",
          options: contractOptions,
        },
        { name: "asalLokasi", label: "Asal Lokasi", placeholder: "Pool / project asal" },
        { name: "tujuanLokasi", label: "Tujuan Lokasi", placeholder: "Project tujuan" },
        { name: "tanggalBerangkat", label: "Tanggal Berangkat", type: "date" },
        { name: "tanggalTiba", label: "Tanggal Tiba", type: "date" },
        { name: "biayaMobilisasi", label: "Biaya Mobilisasi", type: "number", placeholder: "0" },
        { name: "biayaDemobilisasi", label: "Biaya Demobilisasi", type: "number", placeholder: "0" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: statusOptions,
        },
        {
          name: "fotoBerangkatUrl",
          label: "Foto Berangkat",
          type: "image",
          placeholder: "Upload foto berangkat",
          colSpan: "full",
        },
        {
          name: "fotoTibaUrl",
          label: "Foto Tiba",
          type: "image",
          placeholder: "Upload foto tiba",
          colSpan: "full",
        },
        {
          name: "buktiTransferUrl",
          label: "Bukti Transfer",
          type: "file",
          accept: "image/*,.pdf",
          placeholder: "Upload bukti transfer",
          colSpan: "full",
        },
        { name: "catatan", label: "Catatan", placeholder: "Catatan mobilisasi", colSpan: "full" },
      ]}
      columns={[
        {
          header: "No. Mobilisasi",
          className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.noMobilisasi,
        },
        {
          header: "Unit",
          className: "whitespace-nowrap font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.unitLabel,
        },
        {
          header: "Driver",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.driverName || "-",
        },
        {
          header: "Asal",
          className: "max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400",
          render: (item) => item.asalLokasi,
        },
        {
          header: "Tujuan",
          className: "max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400",
          render: (item) => item.tujuanLokasi,
        },
        {
          header: "Tgl Berangkat",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatDate(item.tanggalBerangkat),
        },
        {
          header: "Tgl Tiba",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.tanggalTiba ? formatDate(item.tanggalTiba) : "Dalam perjalanan",
        },
        {
          header: "Biaya Mob.",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatRupiah(item.biayaMobilisasi),
        },
        {
          header: "Status",
          render: (item) => (
            <Badge size="sm" color={statusColor(item.status)}>
              {item.status}
            </Badge>
          ),
        },
        {
          header: "Dokumen",
          className: "whitespace-nowrap",
          render: (item) => {
            const count = [item.fotoBerangkatUrl, item.fotoTibaUrl, item.buktiTransferUrl].filter(Boolean).length;
            return count > 0 ? (
              <span className="rounded-full bg-success-50 px-2 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-300">
                {count} file
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            );
          },
        },
        {
          header: "Cetak",
          className: "whitespace-nowrap",
          render: (item) => (
            <a
              href={`/mobilisasi/${item.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cetak
            </a>
          ),
        },
      ]}
      createAction={createMobilisasiAction}
      updateAction={updateMobilisasiAction}
      deleteAction={deleteMobilisasiAction}
    />
  );
}
