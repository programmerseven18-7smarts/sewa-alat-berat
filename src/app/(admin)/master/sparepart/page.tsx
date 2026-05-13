import type { Metadata } from "next";
import SparepartMaster from "@/components/master/SparepartMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Master Spare Part | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

export default async function SparepartPage() {
  await requirePageAccess("sparepart");

  const [data, suppliers] = await Promise.all([
    prisma.sparepart.findMany({
      orderBy: {
        nama: "asc",
      },
      select: {
        id: true,
        kode: true,
        nama: true,
        satuan: true,
        hargaSatuan: true,
        stok: true,
        supplierId: true,
        supplier: {
          select: {
            nama: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
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
    <SparepartMaster
      suppliers={suppliers}
      data={data.map((item) => ({
        id: item.id,
        kode: item.kode,
        nama: item.nama,
        satuan: item.satuan,
        hargaSatuan: Number(item.hargaSatuan),
        stok: Number(item.stok),
        supplierId: item.supplierId,
        supplierNama: item.supplier?.nama ?? null,
      }))}
    />
  );
}
