"use client";

import MasterDataTable from "@/components/master/MasterDataTable";
import { formatRupiah } from "@/lib/utils";
import {
  createRentalRateAction,
  deleteRentalRateAction,
  updateRentalRateAction,
} from "@/lib/masters/actions";

export type RentalRateCategoryOption = {
  id: number;
  nama: string;
};

export type RentalRateRow = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  nama: string;
  satuan: string;
  tarif: number;
  minimum: number | null;
  catatan: string | null;
};

type RentalRateMasterProps = {
  data: RentalRateRow[];
  categories: RentalRateCategoryOption[];
};

export default function RentalRateMaster({ data, categories }: RentalRateMasterProps) {
  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.nama,
  }));

  return (
    <MasterDataTable
      title="Tarif Sewa"
      description="Master harga sewa per kategori, satuan, dan minimum charge."
      addLabel="Tambah Tarif"
      searchPlaceholder="Cari kategori, nama tarif, satuan, atau catatan..."
      data={data}
      searchFields={["categoryName", "nama", "satuan", "catatan"]}
      getItemName={(item) => item.nama}
      fields={[
        {
          name: "categoryId",
          label: "Kategori",
          type: "select",
          placeholder: "Pilih kategori",
          options: categoryOptions,
        },
        { name: "nama", label: "Nama Tarif", placeholder: "Excavator Bucket" },
        { name: "satuan", label: "Satuan", placeholder: "Jam / Hari / Bulan" },
        { name: "tarif", label: "Tarif", type: "number", placeholder: "485000" },
        { name: "minimum", label: "Minimum", type: "number", placeholder: "8" },
        { name: "catatan", label: "Catatan", placeholder: "Catatan tarif", colSpan: "full" },
      ]}
      columns={[
        {
          header: "Kategori",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.categoryName || "-",
        },
        {
          header: "Nama Tarif",
          className: "text-gray-600 dark:text-gray-400",
          render: (item) => item.nama,
        },
        {
          header: "Satuan",
          className: "text-gray-600 dark:text-gray-400",
          render: (item) => item.satuan,
        },
        {
          header: "Tarif",
          className: "font-semibold text-gray-800 dark:text-white/90",
          render: (item) => formatRupiah(item.tarif),
        },
        {
          header: "Minimum",
          className: "text-gray-600 dark:text-gray-400",
          render: (item) => item.minimum ?? "-",
        },
        {
          header: "Catatan",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.catatan || "-",
        },
      ]}
      createAction={createRentalRateAction}
      updateAction={updateRentalRateAction}
      deleteAction={deleteRentalRateAction}
    />
  );
}
