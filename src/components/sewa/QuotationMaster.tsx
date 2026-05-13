"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createQuotationAction,
  deleteQuotationAction,
  updateQuotationAction,
} from "@/lib/sewa/actions";

export type QuotationCustomerOption = {
  id: number;
  nama: string;
};

export type QuotationUnitOption = {
  id: number;
  label: string;
};

export type QuotationRow = {
  id: number;
  noPenawaran: string;
  customerId: number;
  customerName: string;
  tanggal: string;
  berlakuHingga: string | null;
  unitId: number | null;
  unitLabel: string | null;
  tarif: number;
  satuan: string | null;
  estimasiTotal: number;
  status: string;
  catatan: string | null;
};

type QuotationMasterProps = {
  data: QuotationRow[];
  customers: QuotationCustomerOption[];
  units: QuotationUnitOption[];
};

const statusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Terkirim", label: "Terkirim" },
  { value: "Disetujui", label: "Disetujui" },
  { value: "Ditolak", label: "Ditolak" },
  { value: "Expired", label: "Expired" },
];

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Disetujui") return "success";
  if (status === "Terkirim") return "info";
  if (status === "Ditolak" || status === "Expired") return "error";
  return "warning";
};

export default function QuotationMaster({
  data,
  customers,
  units,
}: QuotationMasterProps) {
  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.nama,
  }));
  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));

  return (
    <MasterDataTable
      title="Penawaran Harga"
      description="Manajemen penawaran harga sewa alat berat ke customer."
      addLabel="Buat Penawaran"
      searchPlaceholder="Cari nomor, customer, unit, status, atau catatan..."
      data={data}
      searchFields={["noPenawaran", "customerName", "unitLabel", "satuan", "status", "catatan"]}
      getItemName={(item) => item.noPenawaran}
      fields={[
        { name: "noPenawaran", label: "No. Penawaran", placeholder: "QUO-2026-0001" },
        {
          name: "customerId",
          label: "Customer",
          type: "select",
          placeholder: "Pilih customer",
          options: customerOptions,
        },
        { name: "tanggal", label: "Tanggal", type: "date" },
        { name: "berlakuHingga", label: "Berlaku Hingga", type: "date" },
        {
          name: "unitId",
          label: "Unit",
          type: "select",
          placeholder: "Pilih unit",
          options: unitOptions,
        },
        { name: "tarif", label: "Tarif", type: "number", placeholder: "2500000" },
        { name: "satuan", label: "Satuan", placeholder: "Hari / Jam / Bulan" },
        { name: "estimasiTotal", label: "Estimasi Total", type: "number", placeholder: "55000000" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: statusOptions,
        },
        { name: "catatan", label: "Catatan", placeholder: "Catatan penawaran", colSpan: "full" },
      ]}
      columns={[
        {
          header: "No. Penawaran",
          className: "whitespace-nowrap font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.noPenawaran,
        },
        {
          header: "Customer",
          className: "whitespace-nowrap font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.customerName,
        },
        {
          header: "Tgl Penawaran",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => formatDate(item.tanggal),
        },
        {
          header: "Berlaku Hingga",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.berlakuHingga ? formatDate(item.berlakuHingga) : "-",
        },
        {
          header: "Unit",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.unitLabel || "-",
        },
        {
          header: "Tarif",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => `${formatRupiah(item.tarif)}/${item.satuan || "-"}`,
        },
        {
          header: "Estimasi Total",
          className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
          render: (item) => formatRupiah(item.estimasiTotal),
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
              href={`/sewa/penawaran/${item.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cetak
            </a>
          ),
        },
      ]}
      createAction={createQuotationAction}
      updateAction={updateQuotationAction}
      deleteAction={deleteQuotationAction}
    />
  );
}
