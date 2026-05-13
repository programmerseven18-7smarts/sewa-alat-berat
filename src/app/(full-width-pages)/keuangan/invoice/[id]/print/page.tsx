import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Invoice",
};

type InvoicePrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  await requirePageAccess("invoice", "print");

  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId)) {
    notFound();
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      noInvoice: true,
      tanggal: true,
      jatuhTempo: true,
      tipe: true,
      subtotal: true,
      pajak: true,
      total: true,
      status: true,
      catatan: true,
      customer: {
        select: {
          kode: true,
          nama: true,
          picNama: true,
          telepon: true,
          email: true,
          alamat: true,
          kota: true,
          npwp: true,
        },
      },
      contract: {
        select: {
          noKontrak: true,
          mulaiSewa: true,
          akhirSewa: true,
          tarif: true,
          satuan: true,
          unit: {
            select: {
              kodeLambung: true,
              merk: true,
              model: true,
            },
          },
          operator: {
            select: {
              nama: true,
            },
          },
          location: {
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
      items: {
        orderBy: { id: "asc" },
        select: {
          deskripsi: true,
          volume: true,
          satuan: true,
          hargaSatuan: true,
          total: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const rows =
    invoice.items.length > 0
      ? invoice.items
      : [
          {
            deskripsi: invoice.tipe || "Tagihan sewa alat berat",
            volume: 1,
            satuan: "Ls",
            hargaSatuan: invoice.subtotal,
            total: invoice.subtotal,
          },
        ];

  const period = invoice.contract?.akhirSewa
    ? `${formatDate(invoice.contract.mulaiSewa)} - ${formatDate(invoice.contract.akhirSewa)}`
    : invoice.contract?.mulaiSewa
      ? formatDate(invoice.contract.mulaiSewa)
      : "-";

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/keuangan/invoice" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Invoice penyewaan dan operasional alat berat.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{invoice.noInvoice}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(invoice.tanggal)}</p>
            <p className="text-sm text-gray-500">
              Jatuh Tempo: {invoice.jatuhTempo ? formatDate(invoice.jatuhTempo) : "-"}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {invoice.status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Ditagihkan Kepada</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{invoice.customer.nama}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {invoice.customer.kode}</p>
              {invoice.customer.picNama && <p>PIC: {invoice.customer.picNama}</p>}
              {invoice.customer.telepon && <p>Telepon: {invoice.customer.telepon}</p>}
              {invoice.customer.email && <p>Email: {invoice.customer.email}</p>}
              {invoice.customer.alamat && <p>{invoice.customer.alamat}</p>}
              {invoice.customer.kota && <p>{invoice.customer.kota}</p>}
              {invoice.customer.npwp && <p>NPWP: {invoice.customer.npwp}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Referensi Sewa</p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>No. Kontrak: {invoice.contract?.noKontrak || "-"}</p>
              <p>Periode: {period}</p>
              <p>
                Unit:{" "}
                {invoice.contract?.unit
                  ? `${invoice.contract.unit.kodeLambung} - ${invoice.contract.unit.merk} ${invoice.contract.unit.model}`
                  : "-"}
              </p>
              <p>Operator: {invoice.contract?.operator?.nama || "-"}</p>
              <p>
                Lokasi:{" "}
                {invoice.contract?.location
                  ? [invoice.contract.location.nama, invoice.contract.location.kota].filter(Boolean).join(", ")
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto py-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Deskripsi</th>
                <th className="py-3 pr-4 text-right">Qty</th>
                <th className="py-3 pr-4">Satuan</th>
                <th className="py-3 pr-4 text-right">Harga</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={`${item.deskripsi}-${index}`} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-800">{item.deskripsi}</td>
                  <td className="py-3 pr-4 text-right text-gray-600">{toNumber(item.volume).toLocaleString("id-ID")}</td>
                  <td className="py-3 pr-4 text-gray-600">{item.satuan || "-"}</td>
                  <td className="py-3 pr-4 text-right text-gray-600">{formatRupiah(toNumber(item.hargaSatuan))}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">{formatRupiah(toNumber(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-4 text-sm text-gray-600">
            {invoice.catatan && (
              <div>
                <p className="font-semibold text-gray-800">Catatan</p>
                <p className="mt-1">{invoice.catatan}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800">Pembayaran</p>
              {invoice.bankAccount ? (
                <div className="mt-1 space-y-1">
                  <p>
                    {invoice.bankAccount.namaBank}
                    {invoice.bankAccount.cabang ? ` Cabang ${invoice.bankAccount.cabang}` : ""}
                  </p>
                  <p>No. Rekening: {invoice.bankAccount.noRekening}</p>
                  <p>Atas Nama: {invoice.bankAccount.atasNama}</p>
                </div>
              ) : (
                <p className="mt-1">Rekening belum dipilih.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pajak</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(invoice.pajak))}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatRupiah(toNumber(invoice.total))}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
