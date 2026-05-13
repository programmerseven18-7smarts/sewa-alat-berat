import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintPageActions from "@/components/common/PrintPageActions";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cetak Work Order",
};

type WorkOrderPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function WorkOrderPrintPage({ params }: WorkOrderPrintPageProps) {
  await requirePageAccess("work_order_maintenance", "print");

  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    notFound();
  }

  const order = await prisma.maintenanceOrder.findUnique({
    where: { id: orderId },
    select: {
      noWo: true,
      tipe: true,
      tanggalMulai: true,
      tanggalSelesai: true,
      hmService: true,
      deskripsi: true,
      mekanik: true,
      status: true,
      totalBiaya: true,
      catatan: true,
      unit: {
        select: {
          kodeLambung: true,
          merk: true,
          model: true,
          tahun: true,
          noPolisi: true,
          noChassis: true,
          noMesin: true,
          currentHm: true,
          category: {
            select: {
              nama: true,
            },
          },
        },
      },
      supplier: {
        select: {
          kode: true,
          nama: true,
          picNama: true,
          telepon: true,
          alamat: true,
        },
      },
      maintenanceParts: {
        orderBy: { id: "asc" },
        select: {
          namaPart: true,
          supplierNama: true,
          harga: true,
          qty: true,
          satuan: true,
          total: true,
          sparepart: {
            select: {
              kode: true,
              nama: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref="/maintenance/work-order" />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Work order perawatan dan perbaikan unit.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Work Order</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{order.noWo}</p>
            <p className="mt-2 text-sm text-gray-500">Tipe: {order.tipe}</p>
            <p className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {order.status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Unit</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {order.unit.kodeLambung} - {order.unit.merk} {order.unit.model}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kategori: {order.unit.category?.nama || "-"}</p>
              <p>Tahun: {order.unit.tahun || "-"}</p>
              <p>No. Polisi: {order.unit.noPolisi || "-"}</p>
              <p>No. Chassis: {order.unit.noChassis || "-"}</p>
              <p>No. Mesin: {order.unit.noMesin || "-"}</p>
              <p>HM Saat Ini: {order.unit.currentHm != null ? `${toNumber(order.unit.currentHm).toLocaleString("id-ID")} HM` : "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Pelaksana</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">{order.mekanik || "-"}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Supplier: {order.supplier?.nama || "-"}</p>
              <p>Kode Supplier: {order.supplier?.kode || "-"}</p>
              <p>PIC: {order.supplier?.picNama || "-"}</p>
              <p>Telepon: {order.supplier?.telepon || "-"}</p>
              {order.supplier?.alamat && <p>{order.supplier.alamat}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div className="space-y-2 text-sm text-gray-600">
            <p className="text-xs font-semibold uppercase text-gray-500">Jadwal Pekerjaan</p>
            <p>Mulai: {order.tanggalMulai ? formatDate(order.tanggalMulai) : "-"}</p>
            <p>Selesai: {order.tanggalSelesai ? formatDate(order.tanggalSelesai) : "-"}</p>
            <p>HM Service: {order.hmService != null ? `${toNumber(order.hmService).toLocaleString("id-ID")} HM` : "-"}</p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="text-xs font-semibold uppercase text-gray-500">Deskripsi Pekerjaan</p>
            <p className="mt-2">{order.deskripsi}</p>
          </div>
        </div>

        <div className="overflow-x-auto py-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Part / Jasa</th>
                <th className="py-3 pr-4">Supplier</th>
                <th className="py-3 pr-4 text-right">Qty</th>
                <th className="py-3 pr-4">Satuan</th>
                <th className="py-3 pr-4 text-right">Harga</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.maintenanceParts.length > 0 ? (
                order.maintenanceParts.map((part, index) => (
                  <tr key={`${part.namaPart}-${index}`} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      {part.sparepart ? `${part.sparepart.kode} - ${part.sparepart.nama}` : part.namaPart}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{part.supplierNama || "-"}</td>
                    <td className="py-3 pr-4 text-right text-gray-600">{toNumber(part.qty).toLocaleString("id-ID")}</td>
                    <td className="py-3 pr-4 text-gray-600">{part.satuan || "-"}</td>
                    <td className="py-3 pr-4 text-right text-gray-600">{formatRupiah(toNumber(part.harga))}</td>
                    <td className="py-3 text-right font-semibold text-gray-800">{formatRupiah(toNumber(part.total))}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-100">
                  <td className="py-4 text-gray-500" colSpan={6}>
                    Belum ada detail part.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-[1fr_320px]">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Catatan</p>
            <p className="mt-1">{order.catatan || "-"}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-lg">
              <span className="font-bold text-gray-900">Total Biaya</span>
              <span className="font-bold text-gray-900">{formatRupiah(toNumber(order.totalBiaya))}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
