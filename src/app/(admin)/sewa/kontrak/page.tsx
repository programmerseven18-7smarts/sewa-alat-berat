import type { Metadata } from "next";
import KontrakClient from "./KontrakClient";
export const metadata: Metadata = { title: "Kontrak Sewa | Sistem Sewa Alat Berat" };
export default function KontrakPage() { return <KontrakClient />; }
