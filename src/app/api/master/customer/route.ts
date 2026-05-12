import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const rows = await sql`
      SELECT * FROM customers
      WHERE nama ILIKE ${"%" + search + "%"} OR kode ILIKE ${"%" + search + "%"}
      ORDER BY nama
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
      INSERT INTO customers (kode, nama, pic_nama, telepon, email, alamat, kota, npwp)
      VALUES (${body.kode}, ${body.nama}, ${body.pic_nama || null}, ${body.telepon || null}, ${body.email || null}, ${body.alamat || null}, ${body.kota || null}, ${body.npwp || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
