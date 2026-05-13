import type { Metadata } from "next";
import UnitSaleHppMaster from "@/components/penjualan-unit/UnitSaleHppMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Penjualan Unit | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

export default async function PenjualanUnitPage() {
  await requirePageAccess("penjualan_unit");

  const [data, units] = await Promise.all([
    prisma.unitSaleHpp.findMany({
      orderBy: { tanggal: "desc" },
      include: {
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
      orderBy: { kodeLambung: "asc" },
      select: {
        id: true,
        kodeLambung: true,
        merk: true,
        model: true,
      },
    }),
  ]);

  return (
    <UnitSaleHppMaster
      mode="sale"
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
      data={data.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        unitLabel: `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`,
        noLaporan: item.noLaporan,
        tanggal: toDateInput(item.tanggal),
        hppPembelian: Number(item.hppPembelian),
        biayaPerbaikan: Number(item.biayaPerbaikan),
        biayaMekanik: Number(item.biayaMekanik),
        biayaCat: Number(item.biayaCat),
        biayaLas: Number(item.biayaLas),
        biayaKebersihan: Number(item.biayaKebersihan),
        totalHpp: Number(item.totalHpp),
        hargaJual: item.hargaJual != null ? Number(item.hargaJual) : null,
        labaRugi: item.labaRugi != null ? Number(item.labaRugi) : null,
        catatan: item.catatan,
      }))}
    />
  );
}
