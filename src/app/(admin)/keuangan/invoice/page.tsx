import type { Metadata } from "next";
import InvoiceMaster from "@/components/keuangan/InvoiceMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Daftar Invoice | Sistem Sewa Alat Berat",
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

export default async function InvoicePage() {
  await requirePageAccess("invoice");

  const [data, customers, contracts, bankAccounts] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noInvoice: true,
        customerId: true,
        contractId: true,
        tanggal: true,
        jatuhTempo: true,
        tipe: true,
        subtotal: true,
        pajak: true,
        total: true,
        status: true,
        bankAccountId: true,
        catatan: true,
        customer: { select: { nama: true } },
        contract: { select: { noKontrak: true } },
        bankAccount: { select: { namaBank: true, noRekening: true, atasNama: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    prisma.rentalContract.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noKontrak: true,
        nilaiKontrak: true,
        customer: { select: { nama: true } },
        unit: { select: { kodeLambung: true } },
      },
    }),
    prisma.bankAccount.findMany({
      orderBy: [{ isDefault: "desc" }, { namaBank: "asc" }],
      select: { id: true, namaBank: true, noRekening: true, atasNama: true },
    }),
  ]);

  return (
    <InvoiceMaster
      customers={customers.map((customer) => ({
        id: customer.id,
        label: customer.nama,
      }))}
      contracts={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.noKontrak} - ${contract.customer.nama} / ${contract.unit.kodeLambung} (${formatRupiah(Number(contract.nilaiKontrak))})`,
      }))}
      bankAccounts={bankAccounts.map((bank) => ({
        id: bank.id,
        label: bankLabel(bank) ?? "",
      }))}
      data={data.map((invoice) => ({
        id: invoice.id,
        noInvoice: invoice.noInvoice,
        customerId: invoice.customerId,
        customerName: invoice.customer.nama,
        contractId: invoice.contractId,
        contractNo: invoice.contract?.noKontrak ?? null,
        tanggal: toDateInput(invoice.tanggal) ?? "",
        jatuhTempo: toDateInput(invoice.jatuhTempo),
        tipe: invoice.tipe,
        subtotal: Number(invoice.subtotal),
        pajak: Number(invoice.pajak),
        total: Number(invoice.total),
        status: invoice.status,
        bankAccountId: invoice.bankAccountId,
        bankLabel: bankLabel(invoice.bankAccount),
        catatan: invoice.catatan,
      }))}
    />
  );
}
