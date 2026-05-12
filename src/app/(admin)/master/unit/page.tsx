import type { Metadata } from "next";
import UnitClient from "./UnitClient";

export const metadata: Metadata = {
  title: "Master Unit Alat Berat | Sistem Sewa Alat Berat",
};

export default function UnitPage() {
  return <UnitClient />;
}
