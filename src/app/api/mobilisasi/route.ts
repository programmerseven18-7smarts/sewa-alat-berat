import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const rows = await sql`
      SELECT m.*, eu.kode_lambung, eu.merk, eu.model,
             d.nama AS driver_nama, rc.no_kontrak
      FROM mobilisasi m
      JOIN equipment_units eu ON m.unit_id = eu.id
      LEFT JOIN drivers d ON m.driver_id = d.id
      LEFT JOIN rental_contracts rc ON m.contract_id = rc.id
      WHERE m.no_mobilisasi ILIKE ${"%" + search + "%"} OR eu.kode_lambung ILIKE ${"%" + search + "%"}
      ORDER BY m.created_at DESC
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
      INSERT INTO mobilisasi (no_mobilisasi, unit_id, driver_id, contract_id, asal_lokasi, tujuan_lokasi, tanggal_berangkat, tanggal_tiba, biaya_mobilisasi, biaya_demobilisasi, status, catatan)
      VALUES (${body.no_mobilisasi}, ${body.unit_id}, ${body.driver_id || null}, ${body.contract_id || null}, ${body.asal_lokasi}, ${body.tujuan_lokasi}, ${body.tanggal_berangkat}, ${body.tanggal_tiba || null}, ${body.biaya_mobilisasi || 0}, ${body.biaya_demobilisasi || 0}, ${body.status || "Direncanakan"}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
