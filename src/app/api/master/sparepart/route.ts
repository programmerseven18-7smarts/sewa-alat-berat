import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const search = new URL(req.url).searchParams.get("search") || "";
  try {
    const data = await sql`
      SELECT sp.*, s.nama AS supplier_nama
      FROM spareparts sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.nama ILIKE ${"%" + search + "%"} OR sp.kode ILIKE ${"%" + search + "%"}
      ORDER BY sp.nama
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
      INSERT INTO spareparts (kode, nama, satuan, harga_satuan, stok, supplier_id)
      VALUES (${body.kode}, ${body.nama}, ${body.satuan || null}, ${body.harga_satuan || 0}, ${body.stok || 0}, ${body.supplier_id || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
