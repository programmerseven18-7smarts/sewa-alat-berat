import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Penawaran",
};

type QuotationPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function QuotationPrintPage({ params }: QuotationPrintPageProps) {
  await requirePageAccess("penawaran_sewa", "print");

  const { id } = await params;
  const quotationId = Number(id);

  if (!Number.isInteger(quotationId)) {
    notFound();
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: {
      noPenawaran: true,
      tanggal: true,
      berlakuHingga: true,
      tarif: true,
      satuan: true,
      estimasiTotal: true,
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
      unit: {
        select: {
          kodeLambung: true,
          merk: true,
          model: true,
          tahun: true,
          noPolisi: true,
          tarifHarian: true,
          tarifBulanan: true,
          category: {
            select: {
              nama: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/sewa/penawaran" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Penawaran harga penyewaan alat berat.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Penawaran</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{quotation.noPenawaran}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(quotation.tanggal)}</p>
            <p className="text-sm text-gray-500">
              Berlaku Hingga: {quotation.berlakuHingga ? formatDate(quotation.berlakuHingga) : "-"}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {quotation.status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Kepada</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{quotation.customer.nama}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {quotation.customer.kode}</p>
              {quotation.customer.picNama && <p>PIC: {quotation.customer.picNama}</p>}
              {quotation.customer.telepon && <p>Telepon: {quotation.customer.telepon}</p>}
              {quotation.customer.email && <p>Email: {quotation.customer.email}</p>}
              {quotation.customer.alamat && <p>{quotation.customer.alamat}</p>}
              {quotation.customer.kota && <p>{quotation.customer.kota}</p>}
              {quotation.customer.npwp && <p>NPWP: {quotation.customer.npwp}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Unit Ditawarkan</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {quotation.unit
                ? `${quotation.unit.kodeLambung} - ${quotation.unit.merk} ${quotation.unit.model}`
                : "-"}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kategori: {quotation.unit?.category?.nama || "-"}</p>
              <p>Tahun: {quotation.unit?.tahun || "-"}</p>
              <p>No. Polisi: {quotation.unit?.noPolisi || "-"}</p>
              <p>Tarif Harian Master: {quotation.unit ? formatRupiah(toNumber(quotation.unit.tarifHarian)) : "-"}</p>
              <p>Tarif Bulanan Master: {quotation.unit ? formatRupiah(toNumber(quotation.unit.tarifBulanan)) : "-"}</p>
            </div>
          </div>
        </div>

        <div className="py-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Deskripsi</th>
                <th className="py-3 pr-4 text-right">Tarif</th>
                <th className="py-3 pr-4">Satuan</th>
                <th className="py-3 text-right">Estimasi Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium text-gray-800">
                  Sewa {quotation.unit?.category?.nama || "alat berat"}
                </td>
                <td className="py-3 pr-4 text-right text-gray-600">{formatRupiah(toNumber(quotation.tarif))}</td>
                <td className="py-3 pr-4 text-gray-600">{quotation.satuan || "-"}</td>
                <td className="py-3 text-right font-semibold text-gray-800">
                  {formatRupiah(toNumber(quotation.estimasiTotal))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-8 border-t border-gray-200 pt-6 md:grid-cols-[1fr_320px]">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Catatan</p>
            <p className="mt-1">{quotation.catatan || "Harga dapat disesuaikan berdasarkan durasi, lokasi, dan kondisi pekerjaan."}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Estimasi Total</span>
              <span className="font-bold text-gray-900">{formatRupiah(toNumber(quotation.estimasiTotal))}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
