import type { Metadata } from "next";
import PaymentMaster from "@/components/keuangan/PaymentMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pembayaran | Sistem Sewa Alat Berat",
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

export default async function PembayaranPage() {
  await requirePageAccess("pembayaran");

  const [data, invoices, bankAccounts] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { tanggal: "desc" },
      select: {
        id: true,
        noPembayaran: true,
        invoiceId: true,
        tanggal: true,
        jumlah: true,
        metode: true,
        bankAccountId: true,
        catatan: true,
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
        status: true,
        customer: { select: { nama: true } },
      },
    }),
    prisma.bankAccount.findMany({
      orderBy: [{ isDefault: "desc" }, { namaBank: "asc" }],
      select: { id: true, namaBank: true, noRekening: true, atasNama: true },
    }),
  ]);

  return (
    <PaymentMaster
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        label: `${invoice.noInvoice} - ${invoice.customer.nama} (${formatRupiah(Number(invoice.total))}, ${invoice.status})`,
      }))}
      bankAccounts={bankAccounts.map((bank) => ({
        id: bank.id,
        label: bankLabel(bank) ?? "",
      }))}
      data={data.map((payment) => ({
        id: payment.id,
        noPembayaran: payment.noPembayaran,
        invoiceId: payment.invoiceId,
        invoiceNo: payment.invoice.noInvoice,
        customerName: payment.invoice.customer.nama,
        tanggal: toDateInput(payment.tanggal) ?? "",
        jumlah: Number(payment.jumlah),
        metode: payment.metode,
        bankAccountId: payment.bankAccountId,
        bankLabel: bankLabel(payment.bankAccount),
        catatan: payment.catatan,
      }))}
    />
  );
}
