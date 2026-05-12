import type { Metadata } from "next";
import OperatorClient from "./OperatorClient";
export const metadata: Metadata = { title: "Master Operator | Sistem Sewa Alat Berat" };
export default function OperatorPage() { return <OperatorClient />; }
