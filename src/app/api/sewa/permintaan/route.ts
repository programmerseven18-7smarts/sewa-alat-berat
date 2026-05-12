import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const data = await sql`
      SELECT rr.*, c.nama AS customer_nama
      FROM rental_requests rr
      LEFT JOIN customers c ON rr.customer_id = c.id
      WHERE (rr.no_permintaan ILIKE ${"%" + search + "%"} OR c.nama ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR rr.status = ${status})
      ORDER BY rr.created_at DESC
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
      INSERT INTO rental_requests (no_permintaan, customer_id, tanggal, lokasi, jenis_alat, mulai_sewa, akhir_sewa, estimasi_jam, catatan, status)
      VALUES (${body.no_permintaan}, ${body.customer_id}, ${body.tanggal}, ${body.lokasi || null}, ${body.jenis_alat || null}, ${body.mulai_sewa || null}, ${body.akhir_sewa || null}, ${body.estimasi_jam || null}, ${body.catatan || null}, 'Pending')
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
