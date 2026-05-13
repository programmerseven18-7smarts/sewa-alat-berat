import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Kwitansi",
};

type ReceiptPrintPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPrintPage({ params }: ReceiptPrintPageProps) {
  await requirePageAccess("kwitansi", "print");

  const { id } = await params;
  const receiptId = Number(id);

  if (!Number.isInteger(receiptId)) {
    notFound();
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    select: {
      noKwitansi: true,
      tanggal: true,
      diterimaDari: true,
      untukPembayaran: true,
      jumlah: true,
      terbilang: true,
      penandatangan: true,
      invoice: {
        select: {
          noInvoice: true,
          tanggal: true,
          total: true,
          customer: {
            select: {
              nama: true,
              alamat: true,
              kota: true,
            },
          },
        },
      },
      bankAccount: {
        select: {
          namaBank: true,
          cabang: true,
          noRekening: true,
          atasNama: true,
        },
      },
    },
  });

  if (!receipt) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/keuangan/kwitansi" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Bukti penerimaan pembayaran sewa dan operasional alat berat.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kwitansi</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{receipt.noKwitansi}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(receipt.tanggal)}</p>
          </div>
        </header>

        <div className="py-8">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 print:bg-white">
            <p className="text-xs font-semibold uppercase text-gray-500">Jumlah Diterima</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatRupiah(Number(receipt.jumlah))}</p>
            {receipt.terbilang && (
              <p className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm italic text-gray-700">
                {receipt.terbilang}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 border-y border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Diterima Dari</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{receipt.diterimaDari}</h2>
            {receipt.invoice?.customer && (
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {receipt.invoice.customer.alamat && <p>{receipt.invoice.customer.alamat}</p>}
                {receipt.invoice.customer.kota && <p>{receipt.invoice.customer.kota}</p>}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Untuk Pembayaran</p>
            <p className="mt-2 text-sm font-medium text-gray-900">{receipt.untukPembayaran}</p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>No. Invoice: {receipt.invoice?.noInvoice || "-"}</p>
              <p>Tanggal Invoice: {receipt.invoice?.tanggal ? formatDate(receipt.invoice.tanggal) : "-"}</p>
              <p>Total Invoice: {receipt.invoice?.total ? formatRupiah(Number(receipt.invoice.total)) : "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 pt-8 md:grid-cols-2">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Rekening Penerimaan</p>
            {receipt.bankAccount ? (
              <div className="mt-2 space-y-1">
                <p>
                  {receipt.bankAccount.namaBank}
                  {receipt.bankAccount.cabang ? ` Cabang ${receipt.bankAccount.cabang}` : ""}
                </p>
                <p>No. Rekening: {receipt.bankAccount.noRekening}</p>
                <p>Atas Nama: {receipt.bankAccount.atasNama}</p>
              </div>
            ) : (
              <p className="mt-2">Rekening belum dipilih.</p>
            )}
          </div>

          <div className="text-center text-sm text-gray-700">
            <p>Hormat kami,</p>
            <div className="h-24" />
            <p className="font-semibold text-gray-900">{receipt.penandatangan || "Finance"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
