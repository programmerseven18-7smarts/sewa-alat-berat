import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  try {
    const rows = await sql`
      SELECT p.*, i.no_invoice, c.nama AS customer_nama, ba.nama_bank, ba.no_rekening
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN bank_accounts ba ON p.bank_account_id = ba.id
      WHERE p.no_pembayaran ILIKE ${"%" + search + "%"} OR i.no_invoice ILIKE ${"%" + search + "%"} OR c.nama ILIKE ${"%" + search + "%"}
      ORDER BY p.created_at DESC
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
      INSERT INTO payments (no_pembayaran, invoice_id, tanggal, jumlah, metode, bank_account_id, catatan)
      VALUES (${body.no_pembayaran}, ${body.invoice_id}, ${body.tanggal}, ${body.jumlah}, ${body.metode || "Transfer"}, ${body.bank_account_id || null}, ${body.catatan || null})
      RETURNING *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
