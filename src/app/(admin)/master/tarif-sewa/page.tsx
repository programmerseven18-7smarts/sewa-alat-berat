import type { Metadata } from "next";
import RentalRateMaster from "@/components/master/RentalRateMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tarif Sewa | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function TarifSewaPage() {
  await requirePageAccess("tarif_sewa");

  const [data, categories] = await Promise.all([
    prisma.rentalRate.findMany({
      orderBy: [
        {
          category: {
            nama: "asc",
          },
        },
        {
          nama: "asc",
        },
      ],
      select: {
        id: true,
        categoryId: true,
        nama: true,
        satuan: true,
        tarif: true,
        minimum: true,
        catatan: true,
        category: {
          select: {
            nama: true,
          },
        },
      },
    }),
    prisma.equipmentCategory.findMany({
      orderBy: {
        nama: "asc",
      },
      select: {
        id: true,
        nama: true,
      },
    }),
  ]);

  return (
    <RentalRateMaster
      categories={categories}
      data={data.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        categoryName: item.category?.nama ?? null,
        nama: item.nama,
        satuan: item.satuan,
        tarif: Number(item.tarif),
        minimum: item.minimum === null ? null : Number(item.minimum),
        catatan: item.catatan,
      }))}
    />
  );
}
