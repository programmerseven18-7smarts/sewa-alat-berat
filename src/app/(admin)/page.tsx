import type { Metadata } from "next";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RevenueChart from "@/components/dashboard/RevenueChart";
import UnitStatusChart from "@/components/dashboard/UnitStatusChart";
import RecentContracts from "@/components/dashboard/RecentContracts";
import ActiveUnitsTable from "@/components/dashboard/ActiveUnitsTable";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard | Sistem Sewa Alat Berat",
  description: "Dashboard monitoring operasional sewa alat berat",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [units, contracts, invoices, payments, recentContracts, activeUnits] = await Promise.all([
    prisma.equipmentUnit.findMany({
      select: { status: true },
    }),
    prisma.rentalContract.findMany({
      select: { status: true },
    }),
    prisma.invoice.findMany({
      where: { tanggal: { gte: yearAgo } },
      select: {
        tanggal: true,
        total: true,
        payments: { select: { jumlah: true } },
      },
    }),
    prisma.payment.findMany({
      where: { tanggal: { gte: monthStart } },
      select: { jumlah: true },
    }),
    prisma.rentalContract.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        noKontrak: true,
        mulaiSewa: true,
        status: true,
        nilaiKontrak: true,
        customer: { select: { nama: true } },
        unit: { select: { kodeLambung: true } },
      },
    }),
    prisma.equipmentUnit.findMany({
      orderBy: [{ status: "asc" }, { kodeLambung: "asc" }],
      take: 10,
      select: {
        kodeLambung: true,
        merk: true,
        model: true,
        status: true,
        category: { select: { nama: true } },
        location: { select: { nama: true } },
      },
    }),
  ]);

  const invoiceOutstanding = invoices.reduce((sum, invoice) => {
    const paid = invoice.payments.reduce((total, payment) => total + Number(payment.jumlah), 0);
    return sum + Math.max(Number(invoice.total) - paid, 0);
  }, 0);

  const currentMonthInvoices = invoices.filter(
    (invoice) => invoice.tanggal >= monthStart
  );

  const monthlyTotals = new Map<string, number>();
  invoices.forEach((invoice) => {
    const key = monthKey(invoice.tanggal);
    monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + Number(invoice.total));
  });

  return {
    unitStats: {
      on_duty: String(units.filter((unit) => unit.status === "On Duty").length),
      stand_by: String(units.filter((unit) => unit.status === "Stand By").length),
      break_down: String(units.filter((unit) => unit.status === "Break Down").length),
      maintenance: String(units.filter((unit) => unit.status === "Maintenance").length),
      total: String(units.length),
    },
    contractStats: {
      aktif: String(contracts.filter((contract) => contract.status === "Aktif").length),
      total: String(contracts.length),
    },
    invoiceStats: {
      piutang: String(invoiceOutstanding),
      pendapatan_bulan_ini: String(currentMonthInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)),
    },
    paymentStats: {
      penerimaan_bulan_ini: String(payments.reduce((sum, payment) => sum + Number(payment.jumlah), 0)),
    },
    monthlyRevenue: Array.from(monthlyTotals.entries()).map(([key, total]) => {
      const [tahun, bulan] = key.split("-").map(Number);
      return { bulan, tahun, total: String(total) };
    }),
    recentContracts: recentContracts.map((contract) => ({
      no_kontrak: contract.noKontrak,
      customer_nama: contract.customer.nama,
      unit_kode: contract.unit.kodeLambung,
      mulai_sewa: contract.mulaiSewa.toISOString(),
      status: contract.status,
      nilai_kontrak: String(contract.nilaiKontrak),
    })),
    activeUnits: activeUnits.map((unit) => ({
      kode_lambung: unit.kodeLambung,
      kategori: unit.category?.nama ?? "-",
      merk: unit.merk,
      model: unit.model,
      status: unit.status,
      lokasi: unit.location?.nama ?? "-",
    })),
  };
}

export default async function DashboardPage() {
  await requirePageAccess("dashboard");
  const data = await getDashboardData();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitoring operasional dan keuangan sewa alat berat
          </p>
        </div>
      </div>

      <div className="col-span-12">
        <DashboardMetrics
          stats={{
            unitStats: data.unitStats,
            contractStats: data.contractStats,
            invoiceStats: data.invoiceStats,
            paymentStats: data.paymentStats,
          }}
        />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <RevenueChart data={data.monthlyRevenue} />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <UnitStatusChart stats={data.unitStats} />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentContracts data={data.recentContracts} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <ActiveUnitsTable data={data.activeUnits} />
      </div>
    </div>
  );
}
