import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Template Dokumen | Sistem Sewa Alat Berat",
};

const documentTemplates = [
  {
    title: "Penawaran Sewa",
    module: "Transaksi Sewa",
    listHref: "/sewa/penawaran",
    printPattern: "/sewa/penawaran/[id]/print",
    description: "Dokumen penawaran harga sewa alat berat untuk customer.",
  },
  {
    title: "Kontrak Sewa",
    module: "Transaksi Sewa",
    listHref: "/sewa/kontrak",
    printPattern: "/sewa/kontrak/[id]/print",
    description: "Kontrak penyewaan berisi customer, unit, operator, lokasi, periode, dan nilai kontrak.",
  },
  {
    title: "Invoice",
    module: "Keuangan",
    listHref: "/keuangan/invoice",
    printPattern: "/keuangan/invoice/[id]/print",
    description: "Tagihan sewa lengkap dengan item invoice, pajak, total, catatan, dan rekening pembayaran.",
  },
  {
    title: "Kwitansi",
    module: "Keuangan",
    listHref: "/keuangan/kwitansi",
    printPattern: "/keuangan/kwitansi/[id]/print",
    description: "Bukti penerimaan pembayaran dengan nominal, terbilang, invoice terkait, dan tanda tangan.",
  },
  {
    title: "Pembayaran",
    module: "Keuangan",
    listHref: "/keuangan/pembayaran",
    printPattern: "/keuangan/pembayaran/[id]/print",
    description: "Bukti pencatatan pembayaran invoice berdasarkan metode dan rekening penerimaan.",
  },
  {
    title: "Mobilisasi",
    module: "Operasional",
    listHref: "/mobilisasi",
    printPattern: "/mobilisasi/[id]/print",
    description: "Surat mobilisasi atau demobilisasi unit berisi rute, driver, kontrak, jadwal, dan biaya.",
  },
  {
    title: "Work Order Maintenance",
    module: "Maintenance",
    listHref: "/maintenance/work-order",
    printPattern: "/maintenance/work-order/[id]/print",
    description: "Perintah kerja maintenance lengkap dengan data unit, pelaksana, deskripsi, part, dan total biaya.",
  },
  {
    title: "Penjualan Unit",
    module: "Penjualan Unit",
    listHref: "/penjualan-unit/penjualan",
    printPattern: "/penjualan-unit/penjualan/[id]/print",
    description: "Dokumen ringkasan penjualan unit dengan HPP, harga jual, dan laba rugi.",
  },
  {
    title: "HPP Unit",
    module: "Penjualan Unit",
    listHref: "/penjualan-unit/hpp",
    printPattern: "/penjualan-unit/hpp/[id]/print",
    description: "Laporan harga pokok unit berdasarkan pembelian dan komponen biaya persiapan.",
  },
];

export default async function TemplateDokumenPage() {
  await requirePageAccess("template_dokumen");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Template Dokumen</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ringkasan dokumen cetak yang sudah aktif. Preview dokumen dibuka dari tombol Cetak pada data transaksi.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Template Aktif</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{documentTemplates.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Format</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">Print/PDF</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Akses</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">Permission Print</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documentTemplates.map((template) => (
          <div
            key={template.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-brand-600 dark:text-brand-400">{template.module}</p>
                <h3 className="mt-2 text-base font-semibold text-gray-800 dark:text-white/90">{template.title}</h3>
              </div>
              <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
                Aktif
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">{template.description}</p>
            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
              {template.printPattern}
            </div>
            <Link
              href={template.listHref}
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-800 dark:text-gray-300 dark:hover:border-brand-700"
            >
              Buka Data
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
