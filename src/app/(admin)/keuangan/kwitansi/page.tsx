import type { Metadata } from "next";
import ReceiptMaster from "@/components/keuangan/ReceiptMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kwitansi | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const bankLabel = (bank: { namaBank: string; noRekening: string; atasNama: string } | null) => {
  if (!bank) return null;
  return `${bank.namaBank} ${bank.noRekening} a.n ${bank.atasNama}`;
};

export default async function KwitansiPage() {
  await requirePageAccess("kwitansi");

  const [data, invoices, bankAccounts] = await Promise.all([
    prisma.receipt.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noKwitansi: true,
        invoiceId: true,
        tanggal: true,
        diterimaDari: true,
        untukPembayaran: true,
        jumlah: true,
        terbilang: true,
        bankAccountId: true,
        penandatangan: true,
        invoice: {
          select: {
            noInvoice: true,
            customer: { select: { nama: true } },
          },
        },
        bankAccount: { select: { namaBank: true, noRekening: true, atasNama: true } },
      },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noInvoice: true,
        total: true,
        customer: { select: { nama: true } },
      },
    }),
    prisma.bankAccount.findMany({
      orderBy: [{ isDefault: "desc" }, { namaBank: "asc" }],
      select: { id: true, namaBank: true, noRekening: true, atasNama: true },
    }),
  ]);

  return (
    <ReceiptMaster
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        label: `${invoice.noInvoice} - ${invoice.customer.nama} (${formatRupiah(Number(invoice.total))})`,
      }))}
      bankAccounts={bankAccounts.map((bank) => ({
        id: bank.id,
        label: bankLabel(bank) ?? "",
      }))}
      data={data.map((receipt) => ({
        id: receipt.id,
        noKwitansi: receipt.noKwitansi,
        invoiceId: receipt.invoiceId,
        invoiceNo: receipt.invoice?.noInvoice ?? null,
        tanggal: toDateInput(receipt.tanggal) ?? "",
        diterimaDari: receipt.diterimaDari,
        untukPembayaran: receipt.untukPembayaran,
        jumlah: Number(receipt.jumlah),
        terbilang: receipt.terbilang,
        bankAccountId: receipt.bankAccountId,
        bankLabel: bankLabel(receipt.bankAccount),
        penandatangan: receipt.penandatangan,
      }))}
    />
  );
}
