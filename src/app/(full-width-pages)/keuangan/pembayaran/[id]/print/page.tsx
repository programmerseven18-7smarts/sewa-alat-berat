import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Pembayaran",
};

type PaymentPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function PaymentPrintPage({ params }: PaymentPrintPageProps) {
  await requirePageAccess("pembayaran", "print");

  const { id } = await params;
  const paymentId = Number(id);

  if (!Number.isInteger(paymentId)) {
    notFound();
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      noPembayaran: true,
      tanggal: true,
      jumlah: true,
      metode: true,
      catatan: true,
      invoice: {
        select: {
          noInvoice: true,
          tanggal: true,
          jatuhTempo: true,
          total: true,
          status: true,
          customer: {
            select: {
              kode: true,
              nama: true,
              picNama: true,
              telepon: true,
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

  if (!payment) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/keuangan/pembayaran" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">Bukti pencatatan pembayaran invoice.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pembayaran</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{payment.noPembayaran}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(payment.tanggal)}</p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {payment.metode}
            </p>
          </div>
        </header>

        <div className="py-8">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 print:bg-white">
            <p className="text-xs font-semibold uppercase text-gray-500">Jumlah Pembayaran</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatRupiah(toNumber(payment.jumlah))}</p>
          </div>
        </div>

        <div className="grid gap-6 border-y border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Customer</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{payment.invoice.customer.nama}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {payment.invoice.customer.kode}</p>
              {payment.invoice.customer.picNama && <p>PIC: {payment.invoice.customer.picNama}</p>}
              {payment.invoice.customer.telepon && <p>Telepon: {payment.invoice.customer.telepon}</p>}
              {payment.invoice.customer.alamat && <p>{payment.invoice.customer.alamat}</p>}
              {payment.invoice.customer.kota && <p>{payment.invoice.customer.kota}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Invoice Terkait</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{payment.invoice.noInvoice}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Tanggal Invoice: {formatDate(payment.invoice.tanggal)}</p>
              <p>Jatuh Tempo: {payment.invoice.jatuhTempo ? formatDate(payment.invoice.jatuhTempo) : "-"}</p>
              <p>Total Invoice: {formatRupiah(toNumber(payment.invoice.total))}</p>
              <p>Status Invoice: {payment.invoice.status}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 pt-8 md:grid-cols-2">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Rekening Penerimaan</p>
            {payment.bankAccount ? (
              <div className="mt-2 space-y-1">
                <p>
                  {payment.bankAccount.namaBank}
                  {payment.bankAccount.cabang ? ` Cabang ${payment.bankAccount.cabang}` : ""}
                </p>
                <p>No. Rekening: {payment.bankAccount.noRekening}</p>
                <p>Atas Nama: {payment.bankAccount.atasNama}</p>
              </div>
            ) : (
              <p className="mt-2">Rekening belum dipilih.</p>
            )}
            {payment.catatan && (
              <div className="mt-5">
                <p className="font-semibold text-gray-800">Catatan</p>
                <p className="mt-1">{payment.catatan}</p>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-700">
            <p>Diterima oleh,</p>
            <div className="h-24" />
            <p className="font-semibold text-gray-900">Finance</p>
          </div>
        </div>
      </section>
    </main>
  );
}
