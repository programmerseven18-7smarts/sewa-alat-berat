import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const rows = await sql`
      SELECT dr.*, eu.kode_lambung, eu.merk, eu.model,
             o.nama AS operator_nama, rc.no_kontrak
      FROM daily_reports dr
      JOIN equipment_units eu ON dr.unit_id = eu.id
      LEFT JOIN operators o ON dr.operator_id = o.id
      LEFT JOIN rental_contracts rc ON dr.contract_id = rc.id
      WHERE eu.kode_lambung ILIKE ${"%" + search + "%"} OR o.nama ILIKE ${"%" + search + "%"}
      ORDER BY dr.tanggal DESC, dr.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  try {
    const [row] = await sql`
      INSERT INTO daily_reports (contract_id, unit_id, operator_id, tanggal, jam_kerja, fuel_liter, hm_awal, hm_akhir, aktivitas, kendala)
      VALUES (${body.contract_id || null}, ${body.unit_id}, ${body.operator_id || null}, ${body.tanggal}, ${body.jam_kerja || 0}, ${body.fuel_liter || 0}, ${body.hm_awal || null}, ${body.hm_akhir || null}, ${body.aktivitas || null}, ${body.kendala || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
