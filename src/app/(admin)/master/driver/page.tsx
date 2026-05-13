import type { Metadata } from "next";
import DriverMaster from "@/components/master/DriverMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Driver | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  await requirePageAccess("driver");

  const data = await prisma.driver.findMany({
    orderBy: {
      nama: "asc",
    },
    select: {
      id: true,
      kode: true,
      nama: true,
      noKtp: true,
      telepon: true,
      noSim: true,
      status: true,
    },
  });

  return <DriverMaster data={data} />;
}
