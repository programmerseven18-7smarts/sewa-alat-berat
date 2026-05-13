import type { Metadata } from "next";
import RentalContractMaster from "@/components/sewa/RentalContractMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kontrak Sewa | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function KontrakPage() {
  await requirePageAccess("kontrak_sewa");

  const [data, customers, units, operators, locations] = await Promise.all([
    prisma.rentalContract.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        noKontrak: true,
        customerId: true,
        unitId: true,
        operatorId: true,
        locationId: true,
        tanggalKontrak: true,
        mulaiSewa: true,
        akhirSewa: true,
        tarif: true,
        satuan: true,
        nilaiKontrak: true,
        dp: true,
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
        operator: {
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
    prisma.operator.findMany({
      orderBy: {
        nama: "asc",
      },
      select: {
        id: true,
        nama: true,
        kode: true,
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

  const unitOptions = units.map((unit) => ({
    id: unit.id,
    label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
  }));

  return (
    <RentalContractMaster
      customers={customers}
      units={unitOptions}
      operators={operators.map((operator) => ({
        id: operator.id,
        label: `${operator.kode} - ${operator.nama}`,
      }))}
      locations={locations.map((location) => ({
        id: location.id,
        label: location.nama,
      }))}
      data={data.map((item) => ({
        id: item.id,
        noKontrak: item.noKontrak,
        customerId: item.customerId,
        customerName: item.customer.nama,
        unitId: item.unitId,
        unitLabel: `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`,
        operatorId: item.operatorId,
        operatorName: item.operator?.nama ?? null,
        locationId: item.locationId,
        locationName: item.location?.nama ?? null,
        tanggalKontrak: toDateInput(item.tanggalKontrak) ?? "",
        mulaiSewa: toDateInput(item.mulaiSewa) ?? "",
        akhirSewa: toDateInput(item.akhirSewa),
        tarif: Number(item.tarif),
        satuan: item.satuan,
        nilaiKontrak: Number(item.nilaiKontrak),
        dp: Number(item.dp),
        status: item.status,
        catatan: item.catatan,
      }))}
    />
  );
}
