import type { Metadata } from "next";
import OperatorMaster from "@/components/master/OperatorMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Operator | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  await requirePageAccess("operator");

  const [data, units] = await Promise.all([
    prisma.operator.findMany({
      orderBy: {
        nama: "asc",
      },
      select: {
        id: true,
        kode: true,
        nama: true,
        noKtp: true,
        telepon: true,
        simType: true,
        simNo: true,
        status: true,
        unitId: true,
        unit: {
          select: {
            kodeLambung: true,
            merk: true,
            model: true,
          },
        },
      },
    }),
    prisma.equipmentUnit.findMany({
      orderBy: {
        kodeLambung: "asc",
      },
      select: {
        id: true,
        kodeLambung: true,
        merk: true,
        model: true,
      },
    }),
  ]);

  return (
    <OperatorMaster
      data={data.map((item) => ({
        ...item,
        unitLabel: item.unit
          ? `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`
          : null,
      }))}
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
    />
  );
}
