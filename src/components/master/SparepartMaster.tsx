"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatRupiah } from "@/lib/utils";
import {
  createSparepartAction,
  deleteSparepartAction,
  updateSparepartAction,
} from "@/lib/masters/actions";

export type SparepartSupplierOption = {
  id: number;
  nama: string;
};

export type SparepartRow = {
  id: number;
  kode: string;
  nama: string;
  satuan: string | null;
  hargaSatuan: number;
  stok: number;
  supplierId: number | null;
  supplierNama: string | null;
};

type SparepartMasterProps = {
  data: SparepartRow[];
  suppliers: SparepartSupplierOption[];
};

const stokColor = (stok: number) => {
  if (stok <= 0) return "error";
  if (stok <= 10) return "warning";
  return "success";
};

export default function SparepartMaster({ data, suppliers }: SparepartMasterProps) {
  const supplierOptions = suppliers.map((supplier) => ({
    value: String(supplier.id),
    label: supplier.nama,
  }));

  return (
    <MasterDataTable
      title="Master Spare Part"
      description="Kelola data sparepart, stok awal, harga, dan pemasok."
      addLabel="Tambah Spare Part"
      searchPlaceholder="Cari kode, nama, satuan, atau supplier..."
      data={data}
      searchFields={["kode", "nama", "satuan", "supplierNama"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "SP-001" },
        { name: "nama", label: "Nama Spare Part", placeholder: "Lampu Ekor Hino 500" },
        { name: "satuan", label: "Satuan", placeholder: "PCS / LEMBAR / SET" },
        { name: "hargaSatuan", label: "Harga Satuan", type: "number", placeholder: "450000" },
        { name: "stok", label: "Stok", type: "number", placeholder: "0" },
        {
          name: "supplierId",
          label: "Supplier",
          type: "select",
          placeholder: "Pilih supplier",
          options: supplierOptions,
        },
      ]}
      columns={[
        {
          header: "Kode",
          className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.kode,
        },
        {
          header: "Nama Spare Part",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.nama,
        },
        {
          header: "Satuan",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.satuan || "-",
        },
        {
          header: "Harga Satuan",
          className: "font-semibold text-gray-800 dark:text-white/90",
          render: (item) => formatRupiah(item.hargaSatuan),
        },
        {
          header: "Stok",
          render: (item) => (
            <Badge size="sm" color={stokColor(item.stok)}>
              {item.stok} {item.satuan || "unit"}
            </Badge>
          ),
        },
        {
          header: "Supplier",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.supplierNama || "-",
        },
      ]}
      createAction={createSparepartAction}
      updateAction={updateSparepartAction}
      deleteAction={deleteSparepartAction}
    />
  );
}
