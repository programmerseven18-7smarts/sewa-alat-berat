import type { Metadata } from "next";
import DailyReportMaster from "@/components/operasional/DailyReportMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Laporan Harian | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function LaporanHarianPage() {
  await requirePageAccess("timesheet");

  const [data, units, operators, contracts] = await Promise.all([
    prisma.dailyReport.findMany({
      orderBy: {
        tanggal: "desc",
      },
      select: {
        id: true,
        contractId: true,
        unitId: true,
        operatorId: true,
        tanggal: true,
        jamKerja: true,
        fuelLiter: true,
        hmAwal: true,
        hmAkhir: true,
        aktivitas: true,
        kendala: true,
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
    prisma.operator.findMany({
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
    <DailyReportMaster
      units={units.map((unit) => ({
        id: unit.id,
        label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
      }))}
      operators={operators.map((operator) => ({
        id: operator.id,
        label: `${operator.kode} - ${operator.nama}`,
      }))}
      contracts={contracts.map((contract) => ({
        id: contract.id,
        label: `${contract.noKontrak} - ${contract.customer.nama} / ${contract.unit.kodeLambung}`,
      }))}
      data={data.map((item) => ({
        id: item.id,
        contractId: item.contractId,
        contractNo: item.contract?.noKontrak ?? null,
        unitId: item.unitId,
        unitLabel: `${item.unit.kodeLambung} (${item.unit.merk} ${item.unit.model})`,
        operatorId: item.operatorId,
        operatorName: item.operator?.nama ?? null,
        tanggal: toDateInput(item.tanggal) ?? "",
        jamKerja: Number(item.jamKerja),
        fuelLiter: Number(item.fuelLiter),
        hmAwal: item.hmAwal === null ? null : Number(item.hmAwal),
        hmAkhir: item.hmAkhir === null ? null : Number(item.hmAkhir),
        aktivitas: item.aktivitas,
        kendala: item.kendala,
      }))}
    />
  );
}
