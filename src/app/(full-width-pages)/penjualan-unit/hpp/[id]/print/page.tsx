import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UnitSalePrintDocument from "@/components/penjualan-unit/UnitSalePrintDocument";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Cetak HPP Unit",
};

type HppPrintPageProps = {
  params: Promise<{ id: string }>;
};

const toNumber = (value: unknown) => Number(value ?? 0);

export default async function HppPrintPage({ params }: HppPrintPageProps) {
  await requirePageAccess("hpp_unit", "print");

  const { id } = await params;
  const reportId = Number(id);

  if (!Number.isInteger(reportId)) {
    notFound();
  }

  const report = await prisma.unitSaleHpp.findUnique({
    where: { id: reportId },
    select: {
      noLaporan: true,
      tanggal: true,
      hppPembelian: true,
      biayaPerbaikan: true,
      biayaMekanik: true,
      biayaCat: true,
      biayaLas: true,
      biayaKebersihan: true,
      totalHpp: true,
      hargaJual: true,
      labaRugi: true,
      catatan: true,
      unit: {
        select: {
          kodeLambung: true,
          merk: true,
          model: true,
          tahun: true,
          noPolisi: true,
          noChassis: true,
          noMesin: true,
          status: true,
          category: { select: { nama: true } },
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  return (
    <UnitSalePrintDocument
      backHref="/penjualan-unit/hpp"
      title="Laporan HPP Unit"
      subtitle="Laporan harga pokok dan biaya persiapan unit."
      report={{
        noLaporan: report.noLaporan,
        tanggal: report.tanggal,
        unit: {
          kodeLambung: report.unit.kodeLambung,
          merk: report.unit.merk,
          model: report.unit.model,
          tahun: report.unit.tahun,
          noPolisi: report.unit.noPolisi,
          noChassis: report.unit.noChassis,
          noMesin: report.unit.noMesin,
          status: report.unit.status,
          categoryName: report.unit.category?.nama ?? null,
        },
        hppPembelian: toNumber(report.hppPembelian),
        biayaPerbaikan: toNumber(report.biayaPerbaikan),
        biayaMekanik: toNumber(report.biayaMekanik),
        biayaCat: toNumber(report.biayaCat),
        biayaLas: toNumber(report.biayaLas),
        biayaKebersihan: toNumber(report.biayaKebersihan),
        totalHpp: toNumber(report.totalHpp),
        hargaJual: report.hargaJual != null ? toNumber(report.hargaJual) : null,
        labaRugi: report.labaRugi != null ? toNumber(report.labaRugi) : null,
        catatan: report.catatan,
      }}
    />
  );
}
