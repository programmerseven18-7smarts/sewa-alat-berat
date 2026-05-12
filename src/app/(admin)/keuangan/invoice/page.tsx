import type { Metadata } from "next";
import InvoiceClient from "./InvoiceClient";
export const metadata: Metadata = { title: "Daftar Invoice | Sistem Sewa Alat Berat" };
export default function InvoicePage() { return <InvoiceClient />; }
