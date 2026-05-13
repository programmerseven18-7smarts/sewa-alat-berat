import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { canUserAccess } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Laporan Piutang | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const overdueDays = (dueDate: Date | null, today: Date) => {
  if (!dueDate) return 0;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();

  return diff > 0 ? Math.floor(diff / 86_400_000) : 0;
};

const derivedStatus = (paid: number, remaining: number, daysOverdue: number) => {
  if (remaining <= 0) return "Lunas";
  if (daysOverdue > 0) return "Jatuh Tempo";
  if (paid > 0) return "Sebagian";
  return "Belum Lunas";
};

const statusColor = (status: string): "success" | "warning" | "error" | "info" => {
  if (status === "Lunas") return "success";
  if (status === "Jatuh Tempo") return "error";
  if (status === "Sebagian") return "warning";
  return "info";
};

export default async function LaporanPiutangPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/signin");
  if (!canUserAccess(user, "piutang", "view") && !canUserAccess(user, "laporan_piutang", "view")) {
    notFound();
  }

  const today = startOfToday();
  const invoices = await prisma.invoice.findMany({
    orderBy: [{ jatuhTempo: "asc" }, { tanggal: "desc" }],
    select: {
      id: true,
      noInvoice: true,
      tanggal: true,
      jatuhTempo: true,
      total: true,
      status: true,
      customer: {
        select: {
          nama: true,
        },
      },
      payments: {
        select: {
          jumlah: true,
        },
      },
    },
  });

  const rows = invoices
    .map((invoice) => {
      const total = Number(invoice.total);
      const terbayar = invoice.payments.reduce((sum, payment) => sum + Number(payment.jumlah), 0);
      const sisa = Math.max(total - terbayar, 0);
      const hariJatuhTempo = overdueDays(invoice.jatuhTempo, today);
      const status = derivedStatus(terbayar, sisa, hariJatuhTempo);

      return {
        id: invoice.id,
        noInvoice: invoice.noInvoice,
        customerName: invoice.customer.nama,
        tanggal: invoice.tanggal,
        jatuhTempo: invoice.jatuhTempo,
        total,
        terbayar,
        sisa,
        hariJatuhTempo,
        status,
      };
    })
    .filter((invoice) => invoice.sisa > 0);

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalInvoice += row.total;
      acc.totalTerbayar += row.terbayar;
      acc.totalPiutang += row.sisa;
      if (row.hariJatuhTempo > 0) acc.overdue += row.sisa;
      if (row.hariJatuhTempo === 0) acc.notDue += row.sisa;
      if (row.status === "Sebagian") acc.partialCount += 1;
      return acc;
    },
    {
      totalInvoice: 0,
      totalTerbayar: 0,
      totalPiutang: 0,
      overdue: 0,
      notDue: 0,
      partialCount: 0,
    }
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan Piutang</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Invoice belum lunas berdasarkan pembayaran yang sudah tercatat.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Piutang</p>
          <p className="mt-1 text-xl font-bold text-error-600 dark:text-error-400">
            {formatRupiah(summary.totalPiutang)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Lewat Jatuh Tempo</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
            {formatRupiah(summary.overdue)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Belum Jatuh Tempo</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
            {formatRupiah(summary.notDue)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Outstanding</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
            {rows.length}
            <span className="ml-2 text-sm font-medium text-gray-400">({summary.partialCount} sebagian)</span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Daftar Piutang</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Total invoice {formatRupiah(summary.totalInvoice)} dengan pembayaran tercatat {formatRupiah(summary.totalTerbayar)}.
          </p>
        </div>
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.id}
          getTitle={(row) => row.noInvoice}
          emptyMessage="Tidak ada piutang outstanding."
          minWidth={980}
          columns={[
            { header: "No. Invoice", className: "font-semibold text-brand-600 dark:text-brand-400", render: (row) => row.noInvoice },
            { header: "Customer", className: "font-medium text-gray-800 dark:text-white/90", render: (row) => row.customerName },
            { header: "Tgl Invoice", className: "text-gray-500 dark:text-gray-400", render: (row) => formatDate(row.tanggal) },
            { header: "Jatuh Tempo", className: "text-gray-500 dark:text-gray-400", render: (row) => row.jatuhTempo ? formatDate(row.jatuhTempo) : "-" },
            { header: "Total", className: "text-gray-500 dark:text-gray-400", render: (row) => formatRupiah(row.total) },
            { header: "Terbayar", className: "font-medium text-success-600 dark:text-success-500", render: (row) => formatRupiah(row.terbayar) },
            { header: "Sisa", className: "font-bold text-error-600 dark:text-error-400", render: (row) => formatRupiah(row.sisa) },
            {
              header: "Umur",
              render: (row) => row.hariJatuhTempo > 0 ? (
                <span className="font-semibold text-error-600 dark:text-error-400">{row.hariJatuhTempo} hari</span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
            },
            { header: "Status", render: (row) => <Badge size="sm" color={statusColor(row.status)}>{row.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
