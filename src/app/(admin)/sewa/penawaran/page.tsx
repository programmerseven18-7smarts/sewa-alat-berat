import type { Metadata } from "next";
import PenawaranClient from "./PenawaranClient";
export const metadata: Metadata = { title: "Penawaran | Sistem Sewa Alat Berat" };
export default function PenawaranPage() { return <PenawaranClient />; }
