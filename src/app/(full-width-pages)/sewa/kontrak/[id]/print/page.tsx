import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Kontrak Sewa",
};

type ContractPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function ContractPrintPage({ params }: ContractPrintPageProps) {
  await requirePageAccess("kontrak_sewa", "print");

  const { id } = await params;
  const contractId = Number(id);

  if (!Number.isInteger(contractId)) {
    notFound();
  }

  const contract = await prisma.rentalContract.findUnique({
    where: { id: contractId },
    select: {
      noKontrak: true,
      tanggalKontrak: true,
      mulaiSewa: true,
      akhirSewa: true,
      tarif: true,
      satuan: true,
      nilaiKontrak: true,
      dp: true,
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
          noChassis: true,
          noMesin: true,
          category: {
            select: {
              nama: true,
            },
          },
        },
      },
      operator: {
        select: {
          kode: true,
          nama: true,
          telepon: true,
          simType: true,
          simNo: true,
        },
      },
      location: {
        select: {
          nama: true,
          alamat: true,
          kota: true,
          provinsi: true,
          picNama: true,
          picTelepon: true,
        },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  const outstanding = toNumber(contract.nilaiKontrak) - toNumber(contract.dp);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/sewa/kontrak" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Kontrak penyewaan unit alat berat.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kontrak Sewa</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{contract.noKontrak}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(contract.tanggalKontrak)}</p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {contract.status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Penyewa</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{contract.customer.nama}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {contract.customer.kode}</p>
              {contract.customer.picNama && <p>PIC: {contract.customer.picNama}</p>}
              {contract.customer.telepon && <p>Telepon: {contract.customer.telepon}</p>}
              {contract.customer.email && <p>Email: {contract.customer.email}</p>}
              {contract.customer.alamat && <p>{contract.customer.alamat}</p>}
              {contract.customer.kota && <p>{contract.customer.kota}</p>}
              {contract.customer.npwp && <p>NPWP: {contract.customer.npwp}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Lokasi Kerja</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{contract.location?.nama || "-"}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {contract.location?.alamat && <p>{contract.location.alamat}</p>}
              <p>{[contract.location?.kota, contract.location?.provinsi].filter(Boolean).join(", ") || "-"}</p>
              {contract.location?.picNama && <p>PIC: {contract.location.picNama}</p>}
              {contract.location?.picTelepon && <p>Telepon PIC: {contract.location.picTelepon}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Unit</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {contract.unit.kodeLambung} - {contract.unit.merk} {contract.unit.model}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kategori: {contract.unit.category?.nama || "-"}</p>
              <p>Tahun: {contract.unit.tahun || "-"}</p>
              <p>No. Polisi: {contract.unit.noPolisi || "-"}</p>
              <p>No. Chassis: {contract.unit.noChassis || "-"}</p>
              <p>No. Mesin: {contract.unit.noMesin || "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Operator</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{contract.operator?.nama || "-"}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kode: {contract.operator?.kode || "-"}</p>
              <p>Telepon: {contract.operator?.telepon || "-"}</p>
              <p>SIM: {[contract.operator?.simType, contract.operator?.simNo].filter(Boolean).join(" ") || "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div className="space-y-2 text-sm text-gray-600">
            <p className="text-xs font-semibold uppercase text-gray-500">Periode Sewa</p>
            <p>Mulai: {formatDate(contract.mulaiSewa)}</p>
            <p>Akhir: {contract.akhirSewa ? formatDate(contract.akhirSewa) : "Open End"}</p>
            <p>Tarif: {formatRupiah(toNumber(contract.tarif))}/{contract.satuan}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nilai Kontrak</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(contract.nilaiKontrak))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DP</span>
              <span className="font-semibold text-gray-900">{formatRupiah(toNumber(contract.dp))}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="font-bold text-gray-900">Sisa</span>
              <span className="font-bold text-gray-900">{formatRupiah(outstanding)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 pt-8 md:grid-cols-2">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Catatan</p>
            <p className="mt-1">{contract.catatan || "Ketentuan operasional mengikuti kesepakatan kedua pihak."}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center text-sm text-gray-700">
            <div>
              <p>Penyewa,</p>
              <div className="h-24" />
              <p className="font-semibold text-gray-900">{contract.customer.nama}</p>
            </div>
            <div>
              <p>Penyedia,</p>
              <div className="h-24" />
              <p className="font-semibold text-gray-900">Sewa Alat Berat</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
