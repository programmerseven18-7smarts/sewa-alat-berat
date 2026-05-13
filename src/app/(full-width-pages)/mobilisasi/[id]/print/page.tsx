import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Mobilisasi",
};

type MobilisasiPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function MobilisasiPrintPage({ params }: MobilisasiPrintPageProps) {
  await requirePageAccess("mobilisasi", "print");

  const { id } = await params;
  const mobilisasiId = Number(id);

  if (!Number.isInteger(mobilisasiId)) {
    notFound();
  }

  const mobilisasi = await prisma.mobilisasi.findUnique({
    where: { id: mobilisasiId },
    select: {
      noMobilisasi: true,
      asalLokasi: true,
      tujuanLokasi: true,
      tanggalBerangkat: true,
      tanggalTiba: true,
      biayaMobilisasi: true,
      biayaDemobilisasi: true,
      status: true,
      catatan: true,
      unit: {
        select: {
          kodeLambung: true,
          merk: true,
          model: true,
          tahun: true,
          noPolisi: true,
          category: { select: { nama: true } },
        },
      },
      driver: {
        select: {
          kode: true,
          nama: true,
          telepon: true,
          noSim: true,
        },
      },
      contract: {
        select: {
          noKontrak: true,
          customer: { select: { nama: true, telepon: true } },
          location: { select: { nama: true, alamat: true, kota: true } },
        },
      },
    },
  });

  if (!mobilisasi) {
    notFound();
  }

  const totalBiaya = toNumber(mobilisasi.biayaMobilisasi) + toNumber(mobilisasi.biayaDemobilisasi);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/mobilisasi" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">Surat mobilisasi dan demobilisasi unit.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mobilisasi</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{mobilisasi.noMobilisasi}</p>
            <p className="mt-2 text-sm text-gray-500">Berangkat: {formatDate(mobilisasi.tanggalBerangkat)}</p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {mobilisasi.status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Unit</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {mobilisasi.unit.kodeLambung} - {mobilisasi.unit.merk} {mobilisasi.unit.model}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kategori: {mobilisasi.unit.category?.nama || "-"}</p>
              <p>Tahun: {mobilisasi.unit.tahun || "-"}</p>
              <p>No. Polisi: {mobilisasi.unit.noPolisi || "-"}</p>
              <p>No. Kontrak: {mobilisasi.contract?.noKontrak || "-"}</p>
              <p>Customer: {mobilisasi.contract?.customer.nama || "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Driver</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{mobilisasi.driver?.nama || "-"}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {mobilisasi.driver?.kode || "-"}</p>
              <p>Telepon: {mobilisasi.driver?.telepon || "-"}</p>
              <p>No. SIM: {mobilisasi.driver?.noSim || "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Rute</p>
            <div className="mt-2 space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-800">Asal</p>
                <p>{mobilisasi.asalLokasi}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Tujuan</p>
                <p>{mobilisasi.tujuanLokasi}</p>
                {mobilisasi.contract?.location && (
                  <p className="mt-1">
                    {[mobilisasi.contract.location.nama, mobilisasi.contract.location.alamat, mobilisasi.contract.location.kota]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="text-xs font-semibold uppercase text-gray-500">Jadwal</p>
            <p>Tanggal Berangkat: {formatDate(mobilisasi.tanggalBerangkat)}</p>
            <p>Tanggal Tiba: {mobilisasi.tanggalTiba ? formatDate(mobilisasi.tanggalTiba) : "Dalam perjalanan"}</p>
          </div>
        </div>

        <div className="grid gap-6 pt-6 md:grid-cols-[1fr_320px]">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Catatan</p>
            <p className="mt-1">{mobilisasi.catatan || "-"}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Biaya Mobilisasi</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(mobilisasi.biayaMobilisasi))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Biaya Demobilisasi</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(mobilisasi.biayaDemobilisasi))}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatRupiah(totalBiaya)}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
