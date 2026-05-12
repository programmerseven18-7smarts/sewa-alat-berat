import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const search = new URL(req.url).searchParams.get("search") || "";
  try {
    const data = await sql`
      SELECT * FROM project_locations
      WHERE nama ILIKE ${"%" + search + "%"} OR kode ILIKE ${"%" + search + "%"}
      ORDER BY kode
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
      INSERT INTO project_locations (kode, nama, alamat, kota, provinsi, pic_nama, pic_telepon)
      VALUES (${body.kode}, ${body.nama}, ${body.alamat || null}, ${body.kota || null}, ${body.provinsi || null}, ${body.pic_nama || null}, ${body.pic_telepon || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
