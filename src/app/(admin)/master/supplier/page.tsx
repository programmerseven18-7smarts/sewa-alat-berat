import type { Metadata } from "next";
import SupplierClient from "./SupplierClient";
export const metadata: Metadata = { title: "Master Supplier | Sistem Sewa Alat Berat" };
export default function SupplierPage() { return <SupplierClient />; }
