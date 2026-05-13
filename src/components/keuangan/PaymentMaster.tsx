"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import Badge from "@/components/ui/badge/Badge";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createPaymentAction,
  deletePaymentAction,
  updatePaymentAction,
} from "@/lib/keuangan/actions";
import type { FinanceOption } from "@/components/keuangan/InvoiceMaster";

export type PaymentRow = {
  id: number;
  noPembayaran: string;
  invoiceId: number;
  invoiceNo: string;
  customerName: string;
  tanggal: string;
  jumlah: number;
  metode: string;
  bankAccountId: number | null;
  bankLabel: string | null;
  catatan: string | null;
};

type PaymentMasterProps = {
  data: PaymentRow[];
  invoices: FinanceOption[];
  bankAccounts: FinanceOption[];
};

const methodColor = (method: string) => {
  if (method === "Transfer") return "info";
  if (method === "Tunai") return "success";
  return "light";
};

export default function PaymentMaster({
  data,
  invoices,
  bankAccounts,
}: PaymentMasterProps) {
  const summary = useMemo(() => {
    return {
      totalPenerimaan: data.reduce((sum, item) => sum + item.jumlah, 0),
      transfer: data.filter((item) => item.metode === "Transfer").length,
    };
  }, [data]);

  const invoiceOptions = invoices.map((invoice) => ({
    value: String(invoice.id),
    label: invoice.label,
  }));
  const bankOptions = bankAccounts.map((bank) => ({
    value: String(bank.id),
    label: bank.label,
  }));

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Pembayaran</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Transfer</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.transfer}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Penerimaan</p>
            <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
              {formatRupiah(summary.totalPenerimaan)}
            </p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Pembayaran"
        description="Catat penerimaan pembayaran invoice dan otomatis perbarui status tagihan."
        addLabel="Input Pembayaran"
        searchPlaceholder="Cari pembayaran, invoice, customer, metode, atau bank..."
        data={data}
        searchFields={["noPembayaran", "invoiceNo", "customerName", "metode", "bankLabel", "catatan"]}
        getItemName={(item) => item.noPembayaran}
        fields={[
          { name: "noPembayaran", label: "No. Pembayaran", placeholder: "PAY-001" },
          { name: "invoiceId", label: "Invoice", type: "select", placeholder: "Pilih invoice", options: invoiceOptions },
          { name: "tanggal", label: "Tanggal", type: "date" },
          { name: "jumlah", label: "Jumlah", type: "number", placeholder: "0" },
          {
            name: "metode",
            label: "Metode",
            type: "select",
            placeholder: "Pilih metode",
            options: [
              { value: "Transfer", label: "Transfer" },
              { value: "Tunai", label: "Tunai" },
              { value: "Giro", label: "Giro" },
              { value: "Cek", label: "Cek" },
            ],
          },
          { name: "bankAccountId", label: "Rekening", type: "select", placeholder: "Pilih rekening", options: bankOptions },
          { name: "catatan", label: "Catatan", placeholder: "Catatan pembayaran", colSpan: "full" },
        ]}
        columns={[
          {
            header: "No. Pembayaran",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => item.noPembayaran,
          },
          {
            header: "Invoice",
            className: "whitespace-nowrap text-gray-700 dark:text-gray-300",
            render: (item) => item.invoiceNo,
          },
          {
            header: "Customer",
            className: "min-w-[180px] text-gray-500 dark:text-gray-400",
            render: (item) => item.customerName,
          },
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Jumlah",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.jumlah),
          },
          {
            header: "Metode",
            className: "whitespace-nowrap",
            render: (item) => (
              <Badge color={methodColor(item.metode)} size="sm">
                {item.metode}
              </Badge>
            ),
          },
          {
            header: "Rekening",
            className: "min-w-[160px] text-gray-500 dark:text-gray-400",
            render: (item) => item.bankLabel || "-",
          },
          {
            header: "Cetak",
            className: "whitespace-nowrap",
            render: (item) => (
              <a
                href={`/keuangan/pembayaran/${item.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cetak
              </a>
            ),
          },
        ]}
        createAction={createPaymentAction}
        updateAction={updatePaymentAction}
        deleteAction={deletePaymentAction}
      />
    </div>
  );
}
