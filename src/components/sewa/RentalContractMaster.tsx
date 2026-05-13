"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createRentalContractAction,
  deleteRentalContractAction,
  updateRentalContractAction,
} from "@/lib/sewa/actions";

export type ContractOption = {
  id: number;
  label: string;
};

export type ContractCustomerOption = {
  id: number;
  nama: string;
};

export type RentalContractRow = {
  id: number;
  noKontrak: string;
  customerId: number;
  customerName: string;
  unitId: number;
  unitLabel: string;
  operatorId: number | null;
  operatorName: string | null;
  locationId: number | null;
  locationName: string | null;
  tanggalKontrak: string;
  mulaiSewa: string;
  akhirSewa: string | null;
  tarif: number;
  satuan: string;
  nilaiKontrak: number;
  dp: number;
  status: string;
  catatan: string | null;
};

type RentalContractMasterProps = {
  data: RentalContractRow[];
  customers: ContractCustomerOption[];
  units: ContractOption[];
  operators: ContractOption[];
  locations: ContractOption[];
};

const statusOptions = [
  { value: "Aktif", label: "Aktif" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Dibatalkan" },
  { value: "Diperpanjang", label: "Diperpanjang" },
];

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Aktif") return "success";
  if (status === "Selesai") return "info";
  if (status === "Dibatalkan") return "error";
  return "warning";
};

export default function RentalContractMaster({
  data,
  customers,
  units,
  operators,
  locations,
}: RentalContractMasterProps) {
  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.nama,
  }));
  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));
  const operatorOptions = operators.map((operator) => ({
    value: String(operator.id),
    label: operator.label,
  }));
  const locationOptions = locations.map((location) => ({
    value: String(location.id),
    label: location.label,
  }));

  return (
    <MasterDataTable
      title="Kontrak Sewa"
      description="Manajemen kontrak penyewaan alat berat."
      addLabel="Buat Kontrak Baru"
      searchPlaceholder="Cari nomor, customer, unit, operator, lokasi, atau status..."
      data={data}
      searchFields={["noKontrak", "customerName", "unitLabel", "operatorName", "locationName", "status", "catatan"]}
      getItemName={(item) => item.noKontrak}
      fields={[
        { name: "noKontrak", label: "No. Kontrak", placeholder: "CTR-2026-0001" },
        {
          name: "customerId",
          label: "Customer",
          type: "select",
          placeholder: "Pilih customer",
          options: customerOptions,
        },
        {
          name: "unitId",
          label: "Unit",
          type: "select",
          placeholder: "Pilih unit",
          options: unitOptions,
        },
        {
          name: "operatorId",
          label: "Operator",
          type: "select",
          placeholder: "Pilih operator",
          options: operatorOptions,
        },
        {
          name: "locationId",
          label: "Lokasi",
          type: "select",
          placeholder: "Pilih lokasi",
          options: locationOptions,
        },
        { name: "tanggalKontrak", label: "Tanggal Kontrak", type: "date" },
        { name: "mulaiSewa", label: "Mulai Sewa", type: "date" },
        { name: "akhirSewa", label: "Akhir Sewa", type: "date" },
        { name: "tarif", label: "Tarif", type: "number", placeholder: "2500000" },
        { name: "satuan", label: "Satuan", placeholder: "Hari / Jam / Bulan" },
        { name: "nilaiKontrak", label: "Nilai Kontrak", type: "number", placeholder: "55000000" },
        { name: "dp", label: "DP", type: "number", placeholder: "0" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: statusOptions,
        },
        { name: "catatan", label: "Catatan", placeholder: "Catatan kontrak", colSpan: "full" },
      ]}
      columns={[
        {
          header: "No. Kontrak",
          className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.noKontrak,
        },
        {
          header: "Customer",
          className: "whitespace-nowrap font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.customerName,
        },
        {
          header: "Unit",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.unitLabel,
        },
        {
          header: "Operator",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.operatorName || "-",
        },
        {
          header: "Mulai Sewa",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatDate(item.mulaiSewa),
        },
        {
          header: "Akhir Sewa",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.akhirSewa ? formatDate(item.akhirSewa) : "Open End",
        },
        {
          header: "Tarif",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => `${formatRupiah(item.tarif)}/${item.satuan}`,
        },
        {
          header: "Nilai Kontrak",
          className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
          render: (item) => formatRupiah(item.nilaiKontrak),
        },
        {
          header: "DP",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatRupiah(item.dp),
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
          header: "Cetak",
          className: "whitespace-nowrap",
          render: (item) => (
            <a
              href={`/sewa/kontrak/${item.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cetak
            </a>
          ),
        },
      ]}
      createAction={createRentalContractAction}
      updateAction={updateRentalContractAction}
      deleteAction={deleteRentalContractAction}
    />
  );
}
