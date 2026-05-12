import type { Metadata } from "next";
import MobilisasiClient from "./MobilisasiClient";
export const metadata: Metadata = { title: "Mobilisasi Alat | Sistem Sewa Alat Berat" };
export default function MobilisasiPage() { return <MobilisasiClient />; }
