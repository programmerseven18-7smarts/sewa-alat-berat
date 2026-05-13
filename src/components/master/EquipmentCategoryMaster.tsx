"use client";

import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createEquipmentCategoryAction,
  deleteEquipmentCategoryAction,
  updateEquipmentCategoryAction,
} from "@/lib/masters/actions";

export type EquipmentCategoryRow = {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
};

type EquipmentCategoryMasterProps = {
  data: EquipmentCategoryRow[];
};

export default function EquipmentCategoryMaster({ data }: EquipmentCategoryMasterProps) {
  return (
    <MasterDataTable
      title="Kategori Alat Berat"
      description="Daftar kategori / jenis alat berat untuk unit dan tarif sewa."
      addLabel="Tambah Kategori"
      searchPlaceholder="Cari kode, nama, atau deskripsi..."
      data={data}
      searchFields={["kode", "nama", "deskripsi"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "EXC" },
        { name: "nama", label: "Nama", placeholder: "Excavator" },
        { name: "deskripsi", label: "Deskripsi", placeholder: "Catatan kategori", colSpan: "full" },
      ]}
      columns={[
        {
          header: "Kode",
          className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.kode,
        },
        {
          header: "Nama",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.nama,
        },
        {
          header: "Deskripsi",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.deskripsi || "-",
        },
      ]}
      createAction={createEquipmentCategoryAction}
      updateAction={updateEquipmentCategoryAction}
      deleteAction={deleteEquipmentCategoryAction}
    />
  );
}
