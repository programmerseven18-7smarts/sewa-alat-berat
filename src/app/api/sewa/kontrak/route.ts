import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const rows = await sql`
      SELECT rc.*, c.nama AS customer_nama, eu.kode_lambung AS unit_kode,
             eu.merk, eu.model, pl.nama AS lokasi_nama,
             o.nama AS operator_nama
      FROM rental_contracts rc
      JOIN customers c ON rc.customer_id = c.id
      JOIN equipment_units eu ON rc.unit_id = eu.id
      LEFT JOIN project_locations pl ON rc.location_id = pl.id
      LEFT JOIN operators o ON rc.operator_id = o.id
      WHERE (rc.no_kontrak ILIKE ${"%" + search + "%"} OR c.nama ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR rc.status = ${status})
      ORDER BY rc.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const [row] = await sql`
      INSERT INTO rental_contracts (no_kontrak, customer_id, unit_id, operator_id, location_id, tanggal_kontrak, mulai_sewa, akhir_sewa, tarif, satuan, nilai_kontrak, dp, status, catatan)
      VALUES (${body.no_kontrak}, ${body.customer_id}, ${body.unit_id}, ${body.operator_id || null}, ${body.location_id || null}, ${body.tanggal_kontrak}, ${body.mulai_sewa}, ${body.akhir_sewa || null}, ${body.tarif || 0}, ${body.satuan || "Hari"}, ${body.nilai_kontrak || 0}, ${body.dp || 0}, ${body.status || "Aktif"}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
