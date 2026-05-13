import type { Metadata } from "next";
import EquipmentUnitMaster from "@/components/master/EquipmentUnitMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Unit Alat Berat | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function UnitPage() {
  await requirePageAccess("master_unit");

  const [data, categories, locations] = await Promise.all([
    prisma.equipmentUnit.findMany({
      orderBy: {
        kodeLambung: "asc",
      },
      select: {
        id: true,
        kodeLambung: true,
        categoryId: true,
        merk: true,
        model: true,
        tahun: true,
        noPolisi: true,
        noChassis: true,
        noMesin: true,
        status: true,
        locationId: true,
        tarifHarian: true,
        tarifBulanan: true,
        currentHm: true,
        catatan: true,
        photoUrl: true,
        category: {
          select: {
            nama: true,
          },
        },
        location: {
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
    prisma.projectLocation.findMany({
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
    <EquipmentUnitMaster
      categories={categories}
      locations={locations}
      data={data.map((item) => ({
        id: item.id,
        kodeLambung: item.kodeLambung,
        categoryId: item.categoryId,
        categoryName: item.category?.nama ?? null,
        merk: item.merk,
        model: item.model,
        tahun: item.tahun,
        noPolisi: item.noPolisi,
        noChassis: item.noChassis,
        noMesin: item.noMesin,
        status: item.status,
        locationId: item.locationId,
        locationName: item.location?.nama ?? null,
        tarifHarian: Number(item.tarifHarian),
        tarifBulanan: Number(item.tarifBulanan),
        currentHm: item.currentHm === null ? null : Number(item.currentHm),
        catatan: item.catatan,
        photoUrl: item.photoUrl,
      }))}
    />
  );
}
