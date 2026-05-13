import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Laporan Pendapatan | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export default async function LaporanPendapatanPage() {
  await requirePageAccess("laporan_pendapatan");

  const tahun = new Date().getFullYear();
  const invoices = await prisma.invoice.findMany({
    where: {
      tanggal: {
        gte: new Date(tahun, 0, 1),
        lt: new Date(tahun + 1, 0, 1),
      },
    },
    select: {
      id: true,
      tanggal: true,
      total: true,
      contractId: true,
      payments: {
        select: {
          jumlah: true,
        },
      },
    },
  });

  const rows = Array.from({ length: 12 }, (_, index) => {
    const monthInvoices = invoices.filter((invoice) => invoice.tanggal.getMonth() === index);
    const totalInvoice = monthInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const totalLunas = monthInvoices.reduce((sum, invoice) => {
      const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + Number(payment.jumlah), 0);
      return sum + Math.min(paid, Number(invoice.total));
    }, 0);

    return {
      bulan: `${MONTHS[index]} ${tahun}`,
      jumlahInvoice: monthInvoices.length,
      jumlahKontrak: new Set(monthInvoices.map((invoice) => invoice.contractId).filter(Boolean)).size,
      totalInvoice,
      totalLunas,
      totalBelumLunas: Math.max(totalInvoice - totalLunas, 0),
    };
  }).filter((row) => row.jumlahInvoice > 0);

  const totalTagihan = rows.reduce((sum, row) => sum + row.totalInvoice, 0);
  const totalLunas = rows.reduce((sum, row) => sum + row.totalLunas, 0);
  const totalBelum = rows.reduce((sum, row) => sum + row.totalBelumLunas, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Pendapatan</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Rekap pendapatan bulanan dari sewa alat berat tahun {tahun}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tagihan {tahun}</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">{formatRupiah(totalTagihan)}</p>
        </div>
        <div className="rounded-2xl border border-success-200 bg-success-50 px-5 py-4 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-xs text-success-700 dark:text-success-400">Sudah Terbayar</p>
          <p className="mt-1 text-xl font-bold text-success-800 dark:text-success-300">{formatRupiah(totalLunas)}</p>
        </div>
        <div className="rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 dark:border-warning-800 dark:bg-warning-900/20">
          <p className="text-xs text-warning-700 dark:text-warning-400">Belum Terbayar</p>
          <p className="mt-1 text-xl font-bold text-warning-800 dark:text-warning-300">{formatRupiah(totalBelum)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.bulan}
          getTitle={(row) => row.bulan}
          emptyMessage={`Tidak ada data pendapatan untuk tahun ${tahun}.`}
          columns={[
            { header: "Bulan", className: "font-semibold text-gray-800 dark:text-white/90", render: (row) => row.bulan },
            { header: "Jml Invoice", className: "text-center text-gray-500 dark:text-gray-400", render: (row) => row.jumlahInvoice },
            { header: "Jml Kontrak", className: "text-center text-gray-500 dark:text-gray-400", render: (row) => row.jumlahKontrak },
            { header: "Total Tagihan", className: "font-semibold text-gray-800 dark:text-white/90", render: (row) => formatRupiah(row.totalInvoice) },
            { header: "Sudah Terbayar", className: "font-medium text-success-600", render: (row) => formatRupiah(row.totalLunas) },
            { header: "Belum Terbayar", className: "font-medium text-warning-600", render: (row) => formatRupiah(row.totalBelumLunas) },
            {
              header: "% Terbayar",
              render: (row) => {
                const pct = row.totalInvoice > 0 ? Math.round((row.totalLunas / row.totalInvoice) * 100) : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-1.5 rounded-full bg-success-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-medium text-gray-600 dark:text-gray-400">{pct}%</span>
                  </div>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
