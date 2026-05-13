import type { Metadata } from "next";
import FuelLogMaster from "@/components/operasional/FuelLogMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Konsumsi BBM | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function BBMPage() {
  await requirePageAccess("bbm");

  const [data, units, contracts] = await Promise.all([
    prisma.fuelLog.findMany({
      orderBy: {
        tanggal: "desc",
      },
      select: {
        id: true,
        unitId: true,
        contractId: true,
        tanggal: true,
        liter: true,
        hargaPerLiter: true,
        total: true,
        supplier: true,
        catatan: true,
        unit: {
          select: {
            kodeLambung: true,
            merk: true,
            model: true,
          },
        },
        contract: {
          select: {
            noKontrak: true,
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
    prisma.rentalContract.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        noKontrak: true,
        customer: {
          select: {
            nama: true,
          },
        },
        unit: {
          select: {
            kodeLambung: true,
          },
        },
      },
    }),
  ]);

  return (
    <FuelLogMaster
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
      contracts={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.noKontrak} - ${contract.customer.nama} / ${contract.unit.kodeLambung}`,
      }))}
      data={data.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        unitLabel: `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`,
        contractId: item.contractId,
        contractNo: item.contract?.noKontrak ?? null,
        tanggal: toDateInput(item.tanggal) ?? "",
        liter: Number(item.liter),
        hargaPerLiter: Number(item.hargaPerLiter),
        total: Number(item.total),
        supplier: item.supplier,
        catatan: item.catatan,
      }))}
    />
  );
}
