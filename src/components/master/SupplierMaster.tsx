"use client";

import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createSupplierAction,
  deleteSupplierAction,
  updateSupplierAction,
} from "@/lib/masters/actions";

export type SupplierRow = {
  id: number;
  kode: string;
  nama: string;
  picNama: string | null;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
};

type SupplierMasterProps = {
  data: SupplierRow[];
};

export default function SupplierMaster({ data }: SupplierMasterProps) {
  return (
    <MasterDataTable
      title="Master Supplier"
      description="Kelola data vendor dan pemasok sparepart / maintenance."
      addLabel="Tambah Supplier"
      searchPlaceholder="Cari kode, nama, PIC, telepon, email, atau alamat..."
      data={data}
      searchFields={["kode", "nama", "picNama", "telepon", "email", "alamat"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "SUP-001" },
        { name: "nama", label: "Nama Perusahaan", placeholder: "Nama supplier" },
        { name: "picNama", label: "PIC", placeholder: "Nama PIC" },
        { name: "telepon", label: "Telepon", placeholder: "021 / 0812..." },
        { name: "email", label: "Email", type: "email", placeholder: "sales@supplier.co.id" },
        { name: "alamat", label: "Alamat", placeholder: "Alamat lengkap", colSpan: "full" },
      ]}
      columns={[
        {
          header: "Kode",
          className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.kode,
        },
        {
          header: "Nama Perusahaan",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.nama,
        },
        {
          header: "PIC",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.picNama || "-",
        },
        {
          header: "Telepon",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.telepon || "-",
        },
        {
          header: "Email",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.email || "-",
        },
        {
          header: "Alamat",
          className: "max-w-[260px] truncate text-gray-500 dark:text-gray-400",
          render: (item) => item.alamat || "-",
        },
      ]}
      createAction={createSupplierAction}
      updateAction={updateSupplierAction}
      deleteAction={deleteSupplierAction}
    />
  );
}
