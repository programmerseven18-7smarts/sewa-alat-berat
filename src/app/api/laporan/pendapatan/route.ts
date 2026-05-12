import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const tahun = new URL(req.url).searchParams.get("tahun") || new Date().getFullYear().toString();
  try {
    const data = await sql`
      SELECT
        TO_CHAR(inv.tanggal, 'YYYY-MM') AS bulan_key,
        TO_CHAR(inv.tanggal, 'Mon YYYY') AS bulan,
        COUNT(inv.id) AS jumlah_invoice,
        COUNT(DISTINCT rc.id) AS jumlah_kontrak,
        COALESCE(SUM(inv.total), 0) AS total_invoice,
        COALESCE(SUM(inv.total) FILTER (WHERE inv.status = 'Lunas'), 0) AS total_lunas,
        COALESCE(SUM(inv.total) FILTER (WHERE inv.status != 'Lunas'), 0) AS total_belum_lunas
      FROM invoices inv
      LEFT JOIN rental_contracts rc ON rc.id = inv.contract_id
      WHERE EXTRACT(YEAR FROM inv.tanggal) = ${Number(tahun)}
      GROUP BY TO_CHAR(inv.tanggal, 'YYYY-MM'), TO_CHAR(inv.tanggal, 'Mon YYYY')
      ORDER BY bulan_key ASC
    `;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
