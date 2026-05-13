import type { Metadata } from "next";
import EquipmentCategoryMaster from "@/components/master/EquipmentCategoryMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kategori Alat | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function KategoriPage() {
  await requirePageAccess("kategori_alat");

  const data = await prisma.equipmentCategory.findMany({
    orderBy: {
      kode: "asc",
    },
    select: {
      id: true,
      kode: true,
      nama: true,
      deskripsi: true,
    },
  });

  return <EquipmentCategoryMaster data={data} />;
}
