import type { Metadata } from "next";
import WorkOrderClient from "./WorkOrderClient";
export const metadata: Metadata = { title: "Work Order Maintenance | Sistem Sewa Alat Berat" };
export default function WorkOrderPage() { return <WorkOrderClient />; }
