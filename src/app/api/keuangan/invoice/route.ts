import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  try {
    const rows = await sql`
      SELECT i.*, c.nama AS customer_nama, rc.no_kontrak,
             ba.nama_bank, ba.no_rekening
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN rental_contracts rc ON i.contract_id = rc.id
      LEFT JOIN bank_accounts ba ON i.bank_account_id = ba.id
      WHERE (i.no_invoice ILIKE ${"%" + search + "%"} OR c.nama ILIKE ${"%" + search + "%"})
        AND (${status} = '' OR i.status = ${status})
      ORDER BY i.created_at DESC
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
      INSERT INTO invoices (no_invoice, contract_id, customer_id, tanggal, jatuh_tempo, tipe, subtotal, pajak, total, status, bank_account_id, catatan)
      VALUES (${body.no_invoice}, ${body.contract_id || null}, ${body.customer_id}, ${body.tanggal}, ${body.jatuh_tempo || null}, ${body.tipe || "Sewa"}, ${body.subtotal || 0}, ${body.pajak || 0}, ${body.total || 0}, ${body.status || "Belum Lunas"}, ${body.bank_account_id || null}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
