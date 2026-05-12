import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const rows = await sql`
      SELECT o.*, eu.kode_lambung AS unit_kode, eu.merk, eu.model
      FROM operators o
      LEFT JOIN equipment_units eu ON o.unit_id = eu.id
      WHERE o.nama ILIKE ${"%" + search + "%"} OR o.kode ILIKE ${"%" + search + "%"}
      ORDER BY o.nama
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
      INSERT INTO operators (kode, nama, no_ktp, telepon, sim_type, sim_no, status, unit_id)
      VALUES (${body.kode}, ${body.nama}, ${body.no_ktp || null}, ${body.telepon || null}, ${body.sim_type || null}, ${body.sim_no || null}, ${body.status || "Aktif"}, ${body.unit_id || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
