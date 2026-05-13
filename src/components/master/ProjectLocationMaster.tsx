"use client";

import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createProjectLocationAction,
  deleteProjectLocationAction,
  updateProjectLocationAction,
} from "@/lib/masters/actions";

export type ProjectLocationRow = {
  id: number;
  kode: string;
  nama: string;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  picNama: string | null;
  picTelepon: string | null;
};

type ProjectLocationMasterProps = {
  data: ProjectLocationRow[];
};

export default function ProjectLocationMaster({ data }: ProjectLocationMasterProps) {
  return (
    <MasterDataTable
      title="Lokasi Proyek"
      description="Daftar lokasi proyek, pool, dan penempatan unit alat berat."
      addLabel="Tambah Lokasi"
      searchPlaceholder="Cari kode, lokasi, kota, atau PIC..."
      data={data}
      searchFields={["kode", "nama", "alamat", "kota", "provinsi", "picNama", "picTelepon"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "LOC-BKS" },
        { name: "nama", label: "Nama Lokasi", placeholder: "Pool Bekasi" },
        { name: "alamat", label: "Alamat", placeholder: "Alamat lengkap", colSpan: "full" },
        { name: "kota", label: "Kota", placeholder: "Bekasi" },
        { name: "provinsi", label: "Provinsi", placeholder: "Jawa Barat" },
        { name: "picNama", label: "PIC", placeholder: "Nama PIC" },
        { name: "picTelepon", label: "Telepon PIC", placeholder: "0812..." },
      ]}
      columns={[
        {
          header: "Kode",
          className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.kode,
        },
        {
          header: "Nama Lokasi",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.nama,
        },
        {
          header: "Kota",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.kota || "-",
        },
        {
          header: "Provinsi",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.provinsi || "-",
        },
        {
          header: "PIC",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.picNama || "-",
        },
        {
          header: "Telepon PIC",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.picTelepon || "-",
        },
      ]}
      createAction={createProjectLocationAction}
      updateAction={updateProjectLocationAction}
      deleteAction={deleteProjectLocationAction}
    />
  );
}
