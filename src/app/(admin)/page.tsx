import type { Metadata } from "next";
import getDb from "@/lib/db";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RevenueChart from "@/components/dashboard/RevenueChart";
import UnitStatusChart from "@/components/dashboard/UnitStatusChart";
import RecentContracts from "@/components/dashboard/RecentContracts";
import ActiveUnitsTable from "@/components/dashboard/ActiveUnitsTable";

export const metadata: Metadata = {
  title: "Dashboard | Sistem Sewa Alat Berat",
  description: "Dashboard monitoring operasional sewa alat berat",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardData() {
  const sql = getDb();
  const [unitStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'On Duty') AS on_duty,
      COUNT(*) FILTER (WHERE status = 'Stand By') AS stand_by,
      COUNT(*) FILTER (WHERE status = 'Break Down') AS break_down,
      COUNT(*) FILTER (WHERE status = 'Maintenance') AS maintenance,
      COUNT(*) AS total
    FROM equipment_units
  `;
  const [contractStats] = await sql`
    SELECT COUNT(*) FILTER (WHERE status = 'Aktif') AS aktif, COUNT(*) AS total
    FROM rental_contracts
  `;
  const [invoiceStats] = await sql`
    SELECT
      COALESCE(SUM(total) FILTER (WHERE status IN ('Belum Lunas','Sebagian','Jatuh Tempo')), 0) AS piutang,
      COALESCE(SUM(total) FILTER (
        WHERE EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM NOW())
      ), 0) AS pendapatan_bulan_ini
    FROM invoices
  `;
  const [paymentStats] = await sql`
    SELECT COALESCE(SUM(jumlah) FILTER (
      WHERE EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM NOW())
    ), 0) AS penerimaan_bulan_ini
    FROM payments
  `;
  const monthlyRevenue = await sql`
    SELECT EXTRACT(MONTH FROM tanggal)::int AS bulan, EXTRACT(YEAR FROM tanggal)::int AS tahun,
           COALESCE(SUM(total), 0)::bigint AS total
    FROM invoices
    WHERE tanggal >= NOW() - INTERVAL '12 months'
    GROUP BY bulan, tahun ORDER BY tahun ASC, bulan ASC
  `;
  const recentContracts = await sql`
    SELECT rc.no_kontrak, c.nama AS customer_nama, eu.kode_lambung AS unit_kode,
           rc.mulai_sewa, rc.status, rc.nilai_kontrak
    FROM rental_contracts rc
    JOIN customers c ON rc.customer_id = c.id
    JOIN equipment_units eu ON rc.unit_id = eu.id
    ORDER BY rc.created_at DESC LIMIT 5
  `;
  const activeUnits = await sql`
    SELECT eu.kode_lambung, ec.nama AS kategori, eu.merk, eu.model, eu.status, pl.nama AS lokasi
    FROM equipment_units eu
    LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
    LEFT JOIN project_locations pl ON eu.location_id = pl.id
    ORDER BY eu.status, eu.kode_lambung LIMIT 10
  `;

  return { unitStats, contractStats, invoiceStats, paymentStats, monthlyRevenue, recentContracts, activeUnits };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Page Header */}
      <div className="col-span-12">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitoring operasional dan keuangan sewa alat berat
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="col-span-12">
        <DashboardMetrics
          stats={{
            unitStats: data.unitStats as never,
            contractStats: data.contractStats as never,
            invoiceStats: data.invoiceStats as never,
            paymentStats: data.paymentStats as never,
          }}
        />
      </div>

      {/* Revenue Chart */}
      <div className="col-span-12 xl:col-span-8">
        <RevenueChart data={data.monthlyRevenue as never} />
      </div>

      {/* Unit Status Donut */}
      <div className="col-span-12 xl:col-span-4">
        <UnitStatusChart stats={data.unitStats as never} />
      </div>

      {/* Recent Contracts */}
      <div className="col-span-12 xl:col-span-7">
        <RecentContracts data={data.recentContracts as never} />
      </div>

      {/* Active Units */}
      <div className="col-span-12 xl:col-span-5">
        <ActiveUnitsTable data={data.activeUnits as never} />
      </div>
    </div>
  );
}
