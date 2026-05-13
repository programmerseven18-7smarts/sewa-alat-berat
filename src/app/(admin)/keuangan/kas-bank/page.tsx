import type { Metadata } from "next";
import BankAccountMaster from "@/components/keuangan/BankAccountMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kas & Bank | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function KasBankPage() {
  await requirePageAccess("kas_bank");

  const data = await prisma.bankAccount.findMany({
    orderBy: [{ isDefault: "desc" }, { namaBank: "asc" }],
    select: {
      id: true,
      namaBank: true,
      cabang: true,
      noRekening: true,
      atasNama: true,
      isDefault: true,
      _count: {
        select: {
          invoices: true,
          payments: true,
          receipts: true,
        },
      },
    },
  });

  return (
    <BankAccountMaster
      data={data.map((bank) => ({
        id: bank.id,
        namaBank: bank.namaBank,
        cabang: bank.cabang,
        noRekening: bank.noRekening,
        atasNama: bank.atasNama,
        isDefault: String(bank.isDefault),
        invoiceCount: bank._count.invoices,
        paymentCount: bank._count.payments,
        receiptCount: bank._count.receipts,
      }))}
    />
  );
}
