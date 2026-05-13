"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatRupiah } from "@/lib/utils";
import {
  createEquipmentUnitAction,
  deleteEquipmentUnitAction,
  updateEquipmentUnitAction,
} from "@/lib/masters/actions";

export type EquipmentUnitCategoryOption = {
  id: number;
  nama: string;
};

export type EquipmentUnitLocationOption = {
  id: number;
  nama: string;
};

export type EquipmentUnitRow = {
  id: number;
  kodeLambung: string;
  categoryId: number | null;
  categoryName: string | null;
  merk: string;
  model: string;
  tahun: number | null;
  noPolisi: string | null;
  noChassis: string | null;
  noMesin: string | null;
  status: string;
  locationId: number | null;
  locationName: string | null;
  tarifHarian: number;
  tarifBulanan: number;
  currentHm: number | null;
  catatan: string | null;
};

type EquipmentUnitMasterProps = {
  data: EquipmentUnitRow[];
  categories: EquipmentUnitCategoryOption[];
  locations: EquipmentUnitLocationOption[];
};

const unitStatusOptions = [
  { value: "Stand By", label: "Stand By" },
  { value: "On Duty", label: "On Duty" },
  { value: "Break Down", label: "Break Down" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Mobilisasi", label: "Mobilisasi" },
];

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Stand By") return "success";
  if (status === "Break Down") return "error";
  if (status === "Maintenance") return "warning";
  return "info";
};

export default function EquipmentUnitMaster({
  data,
  categories,
  locations,
}: EquipmentUnitMasterProps) {
  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.nama,
  }));
  const locationOptions = locations.map((location) => ({
    value: String(location.id),
    label: location.nama,
  }));

  return (
    <MasterDataTable
      title="Unit Alat Berat"
      description="Daftar dan kelola semua unit alat berat beserta tarif dan statusnya."
      addLabel="Tambah Unit"
      searchPlaceholder="Cari kode lambung, kategori, merk, model, lokasi, atau status..."
      data={data}
      searchFields={["kodeLambung", "categoryName", "merk", "model", "noPolisi", "status", "locationName"]}
      getItemName={(item) => item.kodeLambung}
      fields={[
        { name: "kodeLambung", label: "Kode Lambung", placeholder: "EXC-001" },
        {
          name: "categoryId",
          label: "Kategori",
          type: "select",
          placeholder: "Pilih kategori",
          options: categoryOptions,
        },
        { name: "merk", label: "Merk", placeholder: "Komatsu / Hino" },
        { name: "model", label: "Model", placeholder: "PC 200 / 500" },
        { name: "tahun", label: "Tahun", type: "number", placeholder: "2022" },
        { name: "noPolisi", label: "No. Polisi", placeholder: "B 1234 XX" },
        { name: "noChassis", label: "No. Chassis", placeholder: "Nomor chassis" },
        { name: "noMesin", label: "No. Mesin", placeholder: "Nomor mesin" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: unitStatusOptions,
        },
        {
          name: "locationId",
          label: "Lokasi",
          type: "select",
          placeholder: "Pilih lokasi",
          options: locationOptions,
        },
        { name: "tarifHarian", label: "Tarif Harian", type: "number", placeholder: "2500000" },
        { name: "tarifBulanan", label: "Tarif Bulanan", type: "number", placeholder: "55000000" },
        { name: "currentHm", label: "HM Saat Ini", type: "number", placeholder: "2350" },
        { name: "catatan", label: "Catatan", placeholder: "Catatan unit", colSpan: "full" },
      ]}
      columns={[
        {
          header: "Kode Lambung",
          className: "font-semibold text-gray-800 dark:text-white/90",
          render: (item) => item.kodeLambung,
        },
        {
          header: "Kategori",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.categoryName || "-",
        },
        {
          header: "Merk / Model",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => `${item.merk} ${item.model}`,
        },
        {
          header: "Tahun",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.tahun || "-",
        },
        {
          header: "No. Polisi",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.noPolisi || "-",
        },
        {
          header: "Tarif Harian",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatRupiah(item.tarifHarian),
        },
        {
          header: "Lokasi",
          className: "max-w-[180px] truncate text-gray-500 dark:text-gray-400",
          render: (item) => item.locationName || "-",
        },
        {
          header: "Status",
          render: (item) => (
            <Badge size="sm" color={statusColor(item.status)}>
              {item.status}
            </Badge>
          ),
        },
      ]}
      createAction={createEquipmentUnitAction}
      updateAction={updateEquipmentUnitAction}
      deleteAction={deleteEquipmentUnitAction}
    />
  );
}
