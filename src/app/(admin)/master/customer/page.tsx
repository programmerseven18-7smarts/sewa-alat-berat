import type { Metadata } from "next";
import CustomerClient from "./CustomerClient";
export const metadata: Metadata = { title: "Master Customer | Sistem Sewa Alat Berat" };
export default function CustomerPage() { return <CustomerClient />; }
