import type { Metadata } from "next";
import SupplierMaster from "@/components/master/SupplierMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Supplier | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function SupplierPage() {
  await requirePageAccess("supplier");

  const data = await prisma.supplier.findMany({
    orderBy: {
      nama: "asc",
    },
    select: {
      id: true,
      kode: true,
      nama: true,
      picNama: true,
      telepon: true,
      email: true,
      alamat: true,
    },
  });

  return <SupplierMaster data={data} />;
}
