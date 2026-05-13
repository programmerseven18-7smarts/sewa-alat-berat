"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createReceiptAction,
  deleteReceiptAction,
  updateReceiptAction,
} from "@/lib/keuangan/actions";
import type { FinanceOption } from "@/components/keuangan/InvoiceMaster";

export type ReceiptRow = {
  id: number;
  noKwitansi: string;
  invoiceId: number | null;
  invoiceNo: string | null;
  tanggal: string;
  diterimaDari: string;
  untukPembayaran: string;
  jumlah: number;
  terbilang: string | null;
  bankAccountId: number | null;
  bankLabel: string | null;
  penandatangan: string | null;
};

type ReceiptMasterProps = {
  data: ReceiptRow[];
  invoices: FinanceOption[];
  bankAccounts: FinanceOption[];
};

export default function ReceiptMaster({
  data,
  invoices,
  bankAccounts,
}: ReceiptMasterProps) {
  const summary = useMemo(() => {
    return {
      totalKwitansi: data.reduce((sum, item) => sum + item.jumlah, 0),
      linkedInvoice: data.filter((item) => item.invoiceId).length,
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Kwitansi</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Terkait Invoice</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.linkedInvoice}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Nilai Kwitansi</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
              {formatRupiah(summary.totalKwitansi)}
            </p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Kwitansi"
        description="Kelola bukti penerimaan pembayaran dari customer."
        addLabel="Buat Kwitansi"
        searchPlaceholder="Cari nomor, invoice, penerima, pembayaran, bank, atau penandatangan..."
        data={data}
        searchFields={["noKwitansi", "invoiceNo", "diterimaDari", "untukPembayaran", "bankLabel", "penandatangan"]}
        getItemName={(item) => item.noKwitansi}
        fields={[
          { name: "noKwitansi", label: "No. Kwitansi", placeholder: "KWT-001" },
          { name: "invoiceId", label: "Invoice", type: "select", placeholder: "Pilih invoice", options: invoiceOptions },
          { name: "tanggal", label: "Tanggal", type: "date" },
          { name: "diterimaDari", label: "Diterima Dari", placeholder: "Nama customer" },
          { name: "untukPembayaran", label: "Untuk Pembayaran", placeholder: "Pembayaran invoice / DP sewa" },
          { name: "jumlah", label: "Jumlah", type: "number", placeholder: "0" },
          { name: "terbilang", label: "Terbilang", placeholder: "Satu juta rupiah", colSpan: "full" },
          { name: "bankAccountId", label: "Rekening", type: "select", placeholder: "Pilih rekening", options: bankOptions },
          { name: "penandatangan", label: "Penandatangan", placeholder: "Nama penandatangan" },
        ]}
        columns={[
          {
            header: "No. Kwitansi",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => item.noKwitansi,
          },
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Diterima Dari",
            className: "min-w-[180px] font-medium text-gray-800 dark:text-white/90",
            render: (item) => item.diterimaDari,
          },
          {
            header: "Untuk Pembayaran",
            className: "min-w-[220px] text-gray-500 dark:text-gray-400",
            render: (item) => item.untukPembayaran,
          },
          {
            header: "Jumlah",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.jumlah),
          },
          {
            header: "Invoice",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.invoiceNo || "-",
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
                href={`/keuangan/kwitansi/${item.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cetak
              </a>
            ),
          },
        ]}
        createAction={createReceiptAction}
        updateAction={updateReceiptAction}
        deleteAction={deleteReceiptAction}
      />
    </div>
  );
}
