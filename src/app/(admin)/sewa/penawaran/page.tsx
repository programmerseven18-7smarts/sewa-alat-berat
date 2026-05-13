import type { Metadata } from "next";
import QuotationMaster from "@/components/sewa/QuotationMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Penawaran | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function PenawaranPage() {
  await requirePageAccess("penawaran_sewa");

  const [data, customers, units] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        noPenawaran: true,
        customerId: true,
        tanggal: true,
        berlakuHingga: true,
        unitId: true,
        tarif: true,
        satuan: true,
        estimasiTotal: true,
        status: true,
        catatan: true,
        customer: {
          select: {
            nama: true,
          },
        },
        unit: {
          select: {
            kodeLambung: true,
            merk: true,
            model: true,
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
    <QuotationMaster
      customers={customers}
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
      data={data.map((item) => ({
        id: item.id,
        noPenawaran: item.noPenawaran,
        customerId: item.customerId,
        customerName: item.customer.nama,
        tanggal: toDateInput(item.tanggal) ?? "",
        berlakuHingga: toDateInput(item.berlakuHingga),
        unitId: item.unitId,
        unitLabel: item.unit
          ? `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`
          : null,
        tarif: Number(item.tarif),
        satuan: item.satuan,
        estimasiTotal: Number(item.estimasiTotal),
        status: item.status,
        catatan: item.catatan,
      }))}
    />
  );
}
