import type { Metadata } from "next";
import ProjectLocationMaster from "@/components/master/ProjectLocationMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Lokasi Proyek | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function LokasiPage() {
  await requirePageAccess("lokasi_proyek");

  const data = await prisma.projectLocation.findMany({
    orderBy: {
      kode: "asc",
    },
    select: {
      id: true,
      kode: true,
      nama: true,
      alamat: true,
      kota: true,
      provinsi: true,
      picNama: true,
      picTelepon: true,
    },
  });

  return <ProjectLocationMaster data={data} />;
}
