import type { Metadata } from "next";
import JadwalClient from "./JadwalClient";
export const metadata: Metadata = { title: "Jadwal Service | Sistem Sewa Alat Berat" };
export default function JadwalPage() { return <JadwalClient />; }
