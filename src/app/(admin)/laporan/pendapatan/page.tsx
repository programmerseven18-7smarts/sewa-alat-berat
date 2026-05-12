import type { Metadata } from "next";
import LaporanPendapatanClient from "./LaporanPendapatanClient";
export const metadata: Metadata = { title: "Laporan Pendapatan | Sistem Sewa Alat Berat" };
export default function LaporanPendapatanPage() { return <LaporanPendapatanClient />; }
