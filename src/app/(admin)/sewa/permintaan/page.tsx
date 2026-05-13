import type { Metadata } from "next";
import RentalRequestMaster from "@/components/sewa/RentalRequestMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Permintaan Sewa | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function PermintaanPage() {
  await requirePageAccess("permintaan_sewa");

  const [data, customers] = await Promise.all([
    prisma.rentalRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        noPermintaan: true,
        customerId: true,
        tanggal: true,
        lokasi: true,
        jenisAlat: true,
        mulaiSewa: true,
        akhirSewa: true,
        estimasiJam: true,
        status: true,
        catatan: true,
        customer: {
          select: {
            nama: true,
          },
        },
      },
    }),
    prisma.customer.findMany({
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
    <RentalRequestMaster
      customers={customers}
      data={data.map((item) => ({
        id: item.id,
        noPermintaan: item.noPermintaan,
        customerId: item.customerId,
        customerName: item.customer?.nama ?? null,
        tanggal: toDateInput(item.tanggal) ?? "",
        lokasi: item.lokasi,
        jenisAlat: item.jenisAlat,
        mulaiSewa: toDateInput(item.mulaiSewa),
        akhirSewa: toDateInput(item.akhirSewa),
        estimasiJam: item.estimasiJam === null ? null : Number(item.estimasiJam),
        status: item.status,
        catatan: item.catatan,
      }))}
    />
  );
}
