import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const data = await sql`
      SELECT fl.*, eu.kode_lambung AS unit_kode, eu.merk, eu.model
      FROM fuel_logs fl
      LEFT JOIN equipment_units eu ON fl.unit_id = eu.id
      WHERE eu.kode_lambung ILIKE ${"%" + search + "%"} OR eu.merk ILIKE ${"%" + search + "%"}
      ORDER BY fl.tanggal DESC
      LIMIT 100
    `;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  try {
    const [row] = await sql`
      INSERT INTO fuel_logs (unit_id, contract_id, tanggal, liter, harga_per_liter, total, supplier, catatan)
      VALUES (${body.unit_id}, ${body.contract_id || null}, ${body.tanggal}, ${body.liter}, ${body.harga_per_liter || 0}, ${body.total || 0}, ${body.supplier || null}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
