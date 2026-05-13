import type { Metadata } from "next";
import MobilisasiMaster from "@/components/mobilisasi/MobilisasiMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mobilisasi Alat | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function MobilisasiPage() {
  await requirePageAccess("mobilisasi");

  const [data, units, drivers, contracts] = await Promise.all([
    prisma.mobilisasi.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        noMobilisasi: true,
        unitId: true,
        driverId: true,
        contractId: true,
        asalLokasi: true,
        tujuanLokasi: true,
        tanggalBerangkat: true,
        tanggalTiba: true,
        biayaMobilisasi: true,
        biayaDemobilisasi: true,
        status: true,
        catatan: true,
        unit: {
          select: {
            kodeLambung: true,
            merk: true,
            model: true,
          },
        },
        driver: {
          select: {
            nama: true,
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
    prisma.driver.findMany({
      orderBy: {
        nama: "asc",
      },
      select: {
        id: true,
        kode: true,
        nama: true,
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
    <MobilisasiMaster
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
      drivers={drivers.map((driver) => ({
        id: driver.id,
        label: `${driver.kode} - ${driver.nama}`,
      }))}
      contracts={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.noKontrak} - ${contract.customer.nama} / ${contract.unit.kodeLambung}`,
      }))}
      data={data.map((item) => ({
        id: item.id,
        noMobilisasi: item.noMobilisasi,
        unitId: item.unitId,
        unitLabel: `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`,
        driverId: item.driverId,
        driverName: item.driver?.nama ?? null,
        contractId: item.contractId,
        contractNo: item.contract?.noKontrak ?? null,
        asalLokasi: item.asalLokasi,
        tujuanLokasi: item.tujuanLokasi,
        tanggalBerangkat: toDateInput(item.tanggalBerangkat) ?? "",
        tanggalTiba: toDateInput(item.tanggalTiba),
        biayaMobilisasi: Number(item.biayaMobilisasi),
        biayaDemobilisasi: Number(item.biayaDemobilisasi),
        status: item.status,
        catatan: item.catatan,
      }))}
    />
  );
}
