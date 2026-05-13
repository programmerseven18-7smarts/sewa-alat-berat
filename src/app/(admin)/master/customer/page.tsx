import type { Metadata } from "next";
import CustomerMaster from "@/components/master/CustomerMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Customer | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  await requirePageAccess("customer");

  const data = await prisma.customer.findMany({
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
      kota: true,
      npwp: true,
    },
  });

  return <CustomerMaster data={data} />;
}
