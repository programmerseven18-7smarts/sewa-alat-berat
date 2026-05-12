import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const rows = await sql`
      SELECT mo.*, eu.kode_lambung, eu.merk, eu.model, s.nama AS supplier_nama
      FROM maintenance_orders mo
      JOIN equipment_units eu ON mo.unit_id = eu.id
      LEFT JOIN suppliers s ON mo.supplier_id = s.id
      WHERE (mo.no_wo ILIKE ${"%" + search + "%"} OR eu.kode_lambung ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR mo.status = ${status})
      ORDER BY mo.created_at DESC
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
      INSERT INTO maintenance_orders (no_wo, unit_id, tipe, tanggal_mulai, tanggal_selesai, hm_service, deskripsi, mekanik, supplier_id, status, total_biaya, catatan)
      VALUES (${body.no_wo}, ${body.unit_id}, ${body.tipe || "Rutin"}, ${body.tanggal_mulai || null}, ${body.tanggal_selesai || null}, ${body.hm_service || null}, ${body.deskripsi}, ${body.mekanik || null}, ${body.supplier_id || null}, ${body.status || "Open"}, ${body.total_biaya || 0}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
