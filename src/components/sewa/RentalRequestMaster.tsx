"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate } from "@/lib/utils";
import {
  createRentalRequestAction,
  deleteRentalRequestAction,
  updateRentalRequestAction,
} from "@/lib/sewa/actions";

export type RentalRequestCustomerOption = {
  id: number;
  nama: string;
};

export type RentalRequestRow = {
  id: number;
  noPermintaan: string;
  customerId: number | null;
  customerName: string | null;
  tanggal: string;
  lokasi: string | null;
  jenisAlat: string | null;
  mulaiSewa: string | null;
  akhirSewa: string | null;
  estimasiJam: number | null;
  status: string;
  catatan: string | null;
};

type RentalRequestMasterProps = {
  data: RentalRequestRow[];
  customers: RentalRequestCustomerOption[];
};

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Diproses", label: "Diproses" },
  { value: "Ditolak", label: "Ditolak" },
  { value: "Deal", label: "Deal" },
];

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Deal") return "success";
  if (status === "Diproses") return "info";
  if (status === "Ditolak") return "error";
  return "warning";
};

export default function RentalRequestMaster({
  data,
  customers,
}: RentalRequestMasterProps) {
  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.nama,
  }));

  return (
    <MasterDataTable
      title="Permintaan Sewa"
      description="Daftar permintaan penyewaan alat berat dari customer."
      addLabel="Tambah Permintaan"
      searchPlaceholder="Cari nomor, customer, lokasi, jenis alat, atau status..."
      data={data}
      searchFields={["noPermintaan", "customerName", "lokasi", "jenisAlat", "status", "catatan"]}
      getItemName={(item) => item.noPermintaan}
      fields={[
        { name: "noPermintaan", label: "No. Permintaan", placeholder: "REQ-2026-0001" },
        {
          name: "customerId",
          label: "Customer",
          type: "select",
          placeholder: "Pilih customer",
          options: customerOptions,
        },
        { name: "tanggal", label: "Tanggal", type: "date" },
        { name: "lokasi", label: "Lokasi", placeholder: "Lokasi kebutuhan alat" },
        { name: "jenisAlat", label: "Jenis Alat", placeholder: "Excavator / Dump Truck" },
        { name: "mulaiSewa", label: "Mulai Sewa", type: "date" },
        { name: "akhirSewa", label: "Akhir Sewa", type: "date" },
        { name: "estimasiJam", label: "Estimasi Jam", type: "number", placeholder: "8" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: statusOptions,
        },
        { name: "catatan", label: "Catatan", placeholder: "Catatan permintaan", colSpan: "full" },
      ]}
      columns={[
        {
          header: "No. Permintaan",
          className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.noPermintaan,
        },
        {
          header: "Customer",
          className: "whitespace-nowrap font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.customerName || "-",
        },
        {
          header: "Tgl Permintaan",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatDate(item.tanggal),
        },
        {
          header: "Jenis Alat",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.jenisAlat || "-",
        },
        {
          header: "Lokasi",
          className: "max-w-[170px] truncate text-gray-500 dark:text-gray-400",
          render: (item) => item.lokasi || "-",
        },
        {
          header: "Mulai Sewa",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.mulaiSewa ? formatDate(item.mulaiSewa) : "-",
        },
        {
          header: "Akhir Sewa",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.akhirSewa ? formatDate(item.akhirSewa) : "-",
        },
        {
          header: "Est. Jam",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.estimasiJam ? `${item.estimasiJam} jam` : "-",
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
      createAction={createRentalRequestAction}
      updateAction={updateRentalRequestAction}
      deleteAction={deleteRentalRequestAction}
    />
  );
}
