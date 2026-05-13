"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import Badge from "@/components/ui/badge/Badge";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceAction,
} from "@/lib/keuangan/actions";

export type FinanceOption = {
  id: number;
  label: string;
};

export type InvoiceRow = {
  id: number;
  noInvoice: string;
  customerId: number;
  customerName: string;
  contractId: number | null;
  contractNo: string | null;
  tanggal: string;
  jatuhTempo: string | null;
  tipe: string;
  subtotal: number;
  pajak: number;
  total: number;
  status: string;
  bankAccountId: number | null;
  bankLabel: string | null;
  catatan: string | null;
};

type InvoiceMasterProps = {
  data: InvoiceRow[];
  customers: FinanceOption[];
  contracts: FinanceOption[];
  bankAccounts: FinanceOption[];
};

const statusColor = (status: string) => {
  if (status === "Lunas") return "success";
  if (status === "Sebagian") return "warning";
  if (status === "Jatuh Tempo") return "error";
  return "light";
};

export default function InvoiceMaster({
  data,
  customers,
  contracts,
  bankAccounts,
}: InvoiceMasterProps) {
  const summary = useMemo(() => {
    const paid = data.filter((item) => item.status === "Lunas").length;
    const outstanding = data
      .filter((item) => item.status !== "Lunas")
      .reduce((sum, item) => sum + item.total, 0);

    return { outstanding, paid };
  }, [data]);

  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.label,
  }));
  const contractOptions = contracts.map((contract) => ({
    value: String(contract.id),
    label: contract.label,
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Invoice</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Lunas</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.paid}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Piutang Belum Lunas</p>
            <p className="mt-1 text-2xl font-bold text-warning-600 dark:text-warning-400">
              {formatRupiah(summary.outstanding)}
            </p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Invoice"
        description="Kelola tagihan sewa dan tagihan terkait operasional alat berat."
        addLabel="Buat Invoice"
        searchPlaceholder="Cari invoice, customer, kontrak, status, atau bank..."
        data={data}
        searchFields={["noInvoice", "customerName", "contractNo", "status", "bankLabel", "catatan"]}
        getItemName={(item) => item.noInvoice}
        fields={[
          { name: "noInvoice", label: "No. Invoice", placeholder: "INV-001" },
          { name: "customerId", label: "Customer", type: "select", placeholder: "Pilih customer", options: customerOptions },
          { name: "contractId", label: "Kontrak", type: "select", placeholder: "Pilih kontrak", options: contractOptions },
          { name: "tanggal", label: "Tanggal", type: "date" },
          { name: "jatuhTempo", label: "Jatuh Tempo", type: "date" },
          { name: "tipe", label: "Tipe", placeholder: "Sewa" },
          { name: "subtotal", label: "Subtotal", type: "number", placeholder: "0" },
          { name: "pajak", label: "Pajak", type: "number", placeholder: "0" },
          { name: "total", label: "Total", type: "number", placeholder: "0" },
          {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "Pilih status",
            options: [
              { value: "Belum Lunas", label: "Belum Lunas" },
              { value: "Sebagian", label: "Sebagian" },
              { value: "Lunas", label: "Lunas" },
              { value: "Jatuh Tempo", label: "Jatuh Tempo" },
            ],
          },
          { name: "bankAccountId", label: "Rekening", type: "select", placeholder: "Pilih rekening", options: bankOptions },
          { name: "catatan", label: "Catatan", placeholder: "Catatan invoice", colSpan: "full" },
        ]}
        columns={[
          {
            header: "No. Invoice",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => item.noInvoice,
          },
          {
            header: "Customer",
            className: "min-w-[180px] text-gray-700 dark:text-gray-300",
            render: (item) => item.customerName,
          },
          {
            header: "Kontrak",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.contractNo || "-",
          },
          {
            header: "Tanggal",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => formatDate(item.tanggal),
          },
          {
            header: "Jatuh Tempo",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.jatuhTempo ? formatDate(item.jatuhTempo) : "-",
          },
          {
            header: "Total",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => formatRupiah(item.total),
          },
          {
            header: "Status",
            className: "whitespace-nowrap",
            render: (item) => (
              <Badge color={statusColor(item.status)} size="sm">
                {item.status}
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
                href={`/keuangan/invoice/${item.id}/print`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cetak
              </a>
            ),
          },
        ]}
        createAction={createInvoiceAction}
        updateAction={updateInvoiceAction}
        deleteAction={deleteInvoiceAction}
      />
    </div>
  );
}
