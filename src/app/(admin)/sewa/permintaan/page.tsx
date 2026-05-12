import type { Metadata } from "next";
import PermintaanClient from "./PermintaanClient";
export const metadata: Metadata = { title: "Permintaan Sewa | Sistem Sewa Alat Berat" };
export default function PermintaanPage() { return <PermintaanClient />; }
