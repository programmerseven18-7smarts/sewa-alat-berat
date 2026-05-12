import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const units = await sql`
      SELECT eu.*, ec.nama AS kategori_nama, pl.nama AS lokasi_nama
      FROM equipment_units eu
      LEFT JOIN equipment_categories ec ON eu.category_id = ec.id
      LEFT JOIN project_locations pl ON eu.location_id = pl.id
      WHERE (eu.kode_lambung ILIKE ${"%" + search + "%"} OR eu.merk ILIKE ${"%" + search + "%"} OR eu.model ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR eu.status = ${status})
      ORDER BY eu.kode_lambung
    `;
    return NextResponse.json(units);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  try {
    const [unit] = await sql`
      INSERT INTO equipment_units (kode_lambung, category_id, merk, model, tahun, no_polisi, no_chassis, no_mesin, status, location_id, tarif_harian, tarif_bulanan, catatan)
      VALUES (${body.kode_lambung}, ${body.category_id || null}, ${body.merk}, ${body.model}, ${body.tahun || null}, ${body.no_polisi}, ${body.no_chassis}, ${body.no_mesin}, ${body.status || "Stand By"}, ${body.location_id || null}, ${body.tarif_harian || 0}, ${body.tarif_bulanan || 0}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(unit, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
