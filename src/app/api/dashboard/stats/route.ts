import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
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
      SELECT COUNT(*) FILTER (WHERE status = 'Aktif') AS aktif,
             COUNT(*) AS total
      FROM rental_contracts
    `;

    const [invoiceStats] = await sql`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE status = 'Belum Lunas'), 0) AS piutang,
        COALESCE(SUM(total) FILTER (WHERE EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM NOW())), 0) AS pendapatan_bulan_ini
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
      SELECT
        EXTRACT(MONTH FROM tanggal)::int AS bulan,
        EXTRACT(YEAR FROM tanggal)::int AS tahun,
        COALESCE(SUM(total), 0)::bigint AS total
      FROM invoices
      WHERE tanggal >= NOW() - INTERVAL '12 months'
      GROUP BY bulan, tahun
      ORDER BY tahun ASC, bulan ASC
    `;

    const recentContracts = await sql`
      SELECT rc.no_kontrak, c.nama AS customer, eu.kode_lambung AS unit,
             rc.mulai_sewa, rc.status, rc.nilai_kontrak
      FROM rental_contracts rc
      JOIN customers c ON rc.customer_id = c.id
      JOIN equipment_units eu ON rc.unit_id = eu.id
      ORDER BY rc.created_at DESC
      LIMIT 5
    `;

    const activeUnits = await sql`
      SELECT eu.kode_lambung, ec.nama AS kategori, eu.merk, eu.model,
             eu.status, pl.nama AS lokasi
      FROM equipment_units eu
      LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
      LEFT JOIN project_locations pl ON eu.location_id = pl.id
      ORDER BY eu.status, eu.kode_lambung
      LIMIT 8
    `;

    return NextResponse.json({
      unitStats,
      contractStats,
      invoiceStats,
      paymentStats,
      monthlyRevenue,
      recentContracts,
      activeUnits,
    });
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
