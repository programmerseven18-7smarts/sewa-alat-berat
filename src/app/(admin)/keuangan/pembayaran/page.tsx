import type { Metadata } from "next";
import PembayaranClient from "./PembayaranClient";
export const metadata: Metadata = { title: "Pembayaran | Sistem Sewa Alat Berat" };
export default function PembayaranPage() { return <PembayaranClient />; }
