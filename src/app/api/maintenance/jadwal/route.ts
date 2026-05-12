import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
    // Upcoming service schedule: units whose last service HM + 250 is approaching current HM
    const data = await sql`
      SELECT
        eu.id, eu.kode_lambung, eu.merk, eu.model, eu.status,
        ec.nama AS kategori,
        MAX(mo.hm_service) AS last_hm_service,
        MAX(mo.tanggal_selesai) AS last_service_date,
        MAX(mo.tipe) AS last_tipe,
        dr.hm_akhir AS current_hm
      FROM equipment_units eu
      LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
      LEFT JOIN maintenance_orders mo ON mo.unit_id = eu.id AND mo.status = 'Done'
      LEFT JOIN (
        SELECT unit_id, MAX(hm_akhir) AS hm_akhir FROM daily_reports GROUP BY unit_id
      ) dr ON dr.unit_id = eu.id
      GROUP BY eu.id, eu.kode_lambung, eu.merk, eu.model, eu.status, ec.nama, dr.hm_akhir
      ORDER BY eu.kode_lambung
    `;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
