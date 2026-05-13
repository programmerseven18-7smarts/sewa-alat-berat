"use client";

import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from "@/lib/masters/actions";

export type CustomerRow = {
  id: number;
  kode: string;
  nama: string;
  picNama: string | null;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  kota: string | null;
  npwp: string | null;
};

type CustomerMasterProps = {
  data: CustomerRow[];
};

export default function CustomerMaster({ data }: CustomerMasterProps) {
  return (
    <MasterDataTable
      title="Master Customer"
      description="Kelola data pelanggan / customer sewa alat berat."
      addLabel="Tambah Customer"
      searchPlaceholder="Cari kode, nama, PIC, telepon, kota, atau NPWP..."
      data={data}
      searchFields={["kode", "nama", "picNama", "telepon", "email", "kota", "npwp"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "CUST-001" },
        { name: "nama", label: "Nama Perusahaan", placeholder: "Nama customer" },
        { name: "picNama", label: "PIC", placeholder: "Nama PIC" },
        { name: "telepon", label: "Telepon", placeholder: "021 / 0812..." },
        { name: "email", label: "Email", type: "email", placeholder: "admin@customer.co.id" },
        { name: "kota", label: "Kota", placeholder: "Bekasi" },
        { name: "npwp", label: "NPWP", placeholder: "00.000.000.0-000.000" },
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
          header: "Kota",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.kota || "-",
        },
        {
          header: "NPWP",
          className: "font-mono text-xs text-gray-500 dark:text-gray-400",
          render: (item) => item.npwp || "-",
        },
      ]}
      createAction={createCustomerAction}
      updateAction={updateCustomerAction}
      deleteAction={deleteCustomerAction}
    />
  );
}
