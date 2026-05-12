import type { Metadata } from "next";
import BBMClient from "./BBMClient";
export const metadata: Metadata = { title: "Konsumsi BBM | Sistem Sewa Alat Berat" };
export default function BBMPage() { return <BBMClient />; }
