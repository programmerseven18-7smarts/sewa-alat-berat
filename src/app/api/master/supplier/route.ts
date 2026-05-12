import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get("search") || "";
  try {
    const data = await sql`
      SELECT * FROM suppliers
      WHERE nama ILIKE ${"%" + search + "%"} OR kode ILIKE ${"%" + search + "%"}
      ORDER BY nama
    `;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const [row] = await sql`
      INSERT INTO suppliers (kode, nama, pic_nama, telepon, email, alamat)
      VALUES (${body.kode}, ${body.nama}, ${body.pic_nama || null}, ${body.telepon || null}, ${body.email || null}, ${body.alamat || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
