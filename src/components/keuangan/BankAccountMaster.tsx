"use client";

import { useMemo } from "react";
import MasterDataTable from "@/components/master/MasterDataTable";
import Badge from "@/components/ui/badge/Badge";
import {
  createBankAccountAction,
  deleteBankAccountAction,
  updateBankAccountAction,
} from "@/lib/keuangan/actions";

export type BankAccountRow = {
  id: number;
  namaBank: string;
  cabang: string | null;
  noRekening: string;
  atasNama: string;
  isDefault: string;
  invoiceCount: number;
  paymentCount: number;
  receiptCount: number;
};

type BankAccountMasterProps = {
  data: BankAccountRow[];
};

export default function BankAccountMaster({ data }: BankAccountMasterProps) {
  const summary = useMemo(() => {
    return {
      defaultAccount: data.find((item) => item.isDefault === "true")?.namaBank ?? "-",
      usedAccounts: data.filter(
        (item) => item.invoiceCount + item.paymentCount + item.receiptCount > 0
      ).length,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Rekening</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{data.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Dipakai Transaksi</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{summary.usedAccounts}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Rekening Default</p>
            <p className="mt-1 truncate text-2xl font-bold text-gray-800 dark:text-white/90">{summary.defaultAccount}</p>
          </div>
        </div>
      )}

      <MasterDataTable
        title="Kas & Bank"
        description="Kelola rekening penerimaan untuk invoice, pembayaran, dan kwitansi."
        addLabel="Tambah Rekening"
        searchPlaceholder="Cari bank, cabang, no. rekening, atau atas nama..."
        data={data}
        searchFields={["namaBank", "cabang", "noRekening", "atasNama", "isDefault"]}
        getItemName={(item) => `${item.namaBank} ${item.noRekening}`}
        fields={[
          { name: "namaBank", label: "Nama Bank", placeholder: "BCA" },
          { name: "cabang", label: "Cabang", placeholder: "Jakarta" },
          { name: "noRekening", label: "No. Rekening", placeholder: "1234567890" },
          { name: "atasNama", label: "Atas Nama", placeholder: "PT ..." },
          {
            name: "isDefault",
            label: "Default",
            type: "select",
            placeholder: "Pilih status default",
            options: [
              { value: "false", label: "Bukan Default" },
              { value: "true", label: "Default" },
            ],
          },
        ]}
        columns={[
          {
            header: "Nama Bank",
            className: "whitespace-nowrap font-semibold text-gray-800 dark:text-white/90",
            render: (item) => item.namaBank,
          },
          {
            header: "Cabang",
            className: "text-gray-500 dark:text-gray-400",
            render: (item) => item.cabang || "-",
          },
          {
            header: "No. Rekening",
            className: "whitespace-nowrap font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
            render: (item) => item.noRekening,
          },
          {
            header: "Atas Nama",
            className: "min-w-[180px] text-gray-700 dark:text-gray-300",
            render: (item) => item.atasNama,
          },
          {
            header: "Default",
            className: "whitespace-nowrap",
            render: (item) =>
              item.isDefault === "true" ? (
                <Badge color="success" size="sm">
                  Default
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              ),
          },
          {
            header: "Terpakai",
            className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
            render: (item) => item.invoiceCount + item.paymentCount + item.receiptCount,
          },
        ]}
        createAction={createBankAccountAction}
        updateAction={updateBankAccountAction}
        deleteAction={deleteBankAccountAction}
      />
    </div>
  );
}
