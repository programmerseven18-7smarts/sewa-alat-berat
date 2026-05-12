import type { Metadata } from "next";
import LaporanHarianClient from "./LaporanHarianClient";
export const metadata: Metadata = { title: "Laporan Harian | Sistem Sewa Alat Berat" };
export default function LaporanHarianPage() { return <LaporanHarianClient />; }
