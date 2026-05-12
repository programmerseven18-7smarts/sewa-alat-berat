import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const data = await sql`
      SELECT q.*, c.nama AS customer_nama, eu.kode_lambung AS unit_kode, eu.merk, eu.model
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN equipment_units eu ON q.unit_id = eu.id
      WHERE (q.no_penawaran ILIKE ${"%" + search + "%"} OR c.nama ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR q.status = ${status})
      ORDER BY q.created_at DESC
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
      INSERT INTO quotations (no_penawaran, customer_id, tanggal, berlaku_hingga, unit_id, tarif, satuan, estimasi_total, catatan, status)
      VALUES (${body.no_penawaran}, ${body.customer_id}, ${body.tanggal}, ${body.berlaku_hingga || null}, ${body.unit_id || null}, ${body.tarif || 0}, ${body.satuan || null}, ${body.estimasi_total || 0}, ${body.catatan || null}, 'Draft')
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
