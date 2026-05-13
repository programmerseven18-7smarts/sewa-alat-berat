"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  actionWarning,
} from "@/lib/action-feedback";
import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const value = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const nullableValue = (formData: FormData, key: string) =>
  value(formData, key) || null;

const nullableNumberValue = (formData: FormData, key: string) => {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const numberValue = (formData: FormData, key: string) =>
  nullableNumberValue(formData, key) ?? 0;

const dateValue = (formData: FormData, key: string) => {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toId = (formData: FormData) => Number(value(formData, "id"));

const updateUnitHm = async (unitId: number, hmAkhir: number | null) => {
  if (hmAkhir === null) return;

  await prisma.equipmentUnit.update({
    where: { id: unitId },
    data: {
      currentHm: String(hmAkhir),
    },
  });
};

export const createDailyReportAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("timesheet", "create");
  const path = "/operasional/laporan-harian";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses input laporan harian.", path);

  const unitId = nullableNumberValue(formData, "unitId");
  const tanggal = dateValue(formData, "tanggal");
  const jamKerja = numberValue(formData, "jamKerja");
  const fuelLiter = numberValue(formData, "fuelLiter");
  const hmAwal = nullableNumberValue(formData, "hmAwal");
  const hmAkhir = nullableNumberValue(formData, "hmAkhir");

  if (!unitId || !tanggal) {
    return actionError(formData, "Unit dan tanggal wajib diisi.", path);
  }
  if (jamKerja < 0 || fuelLiter < 0) {
    return actionError(formData, "Jam kerja dan BBM tidak boleh minus.", path);
  }
  if (hmAwal !== null && hmAkhir !== null && hmAkhir < hmAwal) {
    return actionError(formData, "HM akhir tidak boleh lebih kecil dari HM awal.", path);
  }

  const report = await prisma.dailyReport.create({
    data: {
      contractId: nullableNumberValue(formData, "contractId"),
      unitId,
      operatorId: nullableNumberValue(formData, "operatorId"),
      tanggal,
      jamKerja: String(jamKerja),
      fuelLiter: String(fuelLiter),
      hmAwal: hmAwal === null ? null : String(hmAwal),
      hmAkhir: hmAkhir === null ? null : String(hmAkhir),
      aktivitas: nullableValue(formData, "aktivitas"),
      kendala: nullableValue(formData, "kendala"),
    },
  });

  await updateUnitHm(unitId, hmAkhir);
  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "DAILY_REPORT",
    entityId: report.id,
    metadata: { unitId, tanggal: report.tanggal.toISOString().slice(0, 10) },
  });

  revalidatePath(path);
  actionSuccess(formData, "Laporan harian berhasil disimpan.", path);
};

export const updateDailyReportAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("timesheet", "edit");
  const path = "/operasional/laporan-harian";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit laporan harian.", path);

  const id = toId(formData);
  const unitId = nullableNumberValue(formData, "unitId");
  const tanggal = dateValue(formData, "tanggal");
  const jamKerja = numberValue(formData, "jamKerja");
  const fuelLiter = numberValue(formData, "fuelLiter");
  const hmAwal = nullableNumberValue(formData, "hmAwal");
  const hmAkhir = nullableNumberValue(formData, "hmAkhir");

  if (!id || !unitId || !tanggal) {
    return actionError(formData, "Data laporan harian tidak valid.", path);
  }
  if (jamKerja < 0 || fuelLiter < 0) {
    return actionError(formData, "Jam kerja dan BBM tidak boleh minus.", path);
  }
  if (hmAwal !== null && hmAkhir !== null && hmAkhir < hmAwal) {
    return actionError(formData, "HM akhir tidak boleh lebih kecil dari HM awal.", path);
  }

  const report = await prisma.dailyReport.update({
    where: { id },
    data: {
      contractId: nullableNumberValue(formData, "contractId"),
      unitId,
      operatorId: nullableNumberValue(formData, "operatorId"),
      tanggal,
      jamKerja: String(jamKerja),
      fuelLiter: String(fuelLiter),
      hmAwal: hmAwal === null ? null : String(hmAwal),
      hmAkhir: hmAkhir === null ? null : String(hmAkhir),
      aktivitas: nullableValue(formData, "aktivitas"),
      kendala: nullableValue(formData, "kendala"),
    },
  });

  await updateUnitHm(unitId, hmAkhir);
  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "DAILY_REPORT",
    entityId: report.id,
    metadata: { unitId, tanggal: report.tanggal.toISOString().slice(0, 10) },
  });

  revalidatePath(path);
  actionSuccess(formData, "Laporan harian berhasil diperbarui.", path);
};

export const deleteDailyReportAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("timesheet", "delete");
  const path = "/operasional/laporan-harian";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus laporan harian.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Laporan harian tidak valid.", path);

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    select: {
      id: true,
      unitId: true,
      tanggal: true,
    },
  });

  if (!report) return actionWarning(formData, "Laporan harian tidak ditemukan.", path);

  await prisma.dailyReport.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "DAILY_REPORT",
    entityId: report.id,
    metadata: { unitId: report.unitId, tanggal: report.tanggal.toISOString().slice(0, 10) },
  });

  revalidatePath(path);
  actionSuccess(formData, "Laporan harian berhasil dihapus.", path);
};

export const createFuelLogAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("bbm", "create");
  const path = "/operasional/bbm";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses input BBM.", path);

  const unitId = nullableNumberValue(formData, "unitId");
  const tanggal = dateValue(formData, "tanggal");
  const liter = numberValue(formData, "liter");
  const hargaPerLiter = numberValue(formData, "hargaPerLiter");

  if (!unitId || !tanggal) return actionError(formData, "Unit dan tanggal wajib diisi.", path);
  if (liter <= 0 || hargaPerLiter < 0) {
    return actionError(formData, "Liter harus lebih dari 0 dan harga tidak boleh minus.", path);
  }

  const fuelLog = await prisma.fuelLog.create({
    data: {
      unitId,
      contractId: nullableNumberValue(formData, "contractId"),
      tanggal,
      liter: String(liter),
      hargaPerLiter: String(hargaPerLiter),
      total: String(liter * hargaPerLiter),
      supplier: nullableValue(formData, "supplier"),
      catatan: nullableValue(formData, "catatan"),
    },
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "FUEL_LOG",
    entityId: fuelLog.id,
    metadata: { unitId, liter, total: liter * hargaPerLiter },
  });

  revalidatePath(path);
  actionSuccess(formData, "Catatan BBM berhasil disimpan.", path);
};

export const updateFuelLogAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("bbm", "edit");
  const path = "/operasional/bbm";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit BBM.", path);

  const id = toId(formData);
  const unitId = nullableNumberValue(formData, "unitId");
  const tanggal = dateValue(formData, "tanggal");
  const liter = numberValue(formData, "liter");
  const hargaPerLiter = numberValue(formData, "hargaPerLiter");

  if (!id || !unitId || !tanggal) return actionError(formData, "Data BBM tidak valid.", path);
  if (liter <= 0 || hargaPerLiter < 0) {
    return actionError(formData, "Liter harus lebih dari 0 dan harga tidak boleh minus.", path);
  }

  const fuelLog = await prisma.fuelLog.update({
    where: { id },
    data: {
      unitId,
      contractId: nullableNumberValue(formData, "contractId"),
      tanggal,
      liter: String(liter),
      hargaPerLiter: String(hargaPerLiter),
      total: String(liter * hargaPerLiter),
      supplier: nullableValue(formData, "supplier"),
      catatan: nullableValue(formData, "catatan"),
    },
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "FUEL_LOG",
    entityId: fuelLog.id,
    metadata: { unitId, liter, total: liter * hargaPerLiter },
  });

  revalidatePath(path);
  actionSuccess(formData, "Catatan BBM berhasil diperbarui.", path);
};

export const deleteFuelLogAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("bbm", "delete");
  const path = "/operasional/bbm";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus BBM.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Catatan BBM tidak valid.", path);

  const fuelLog = await prisma.fuelLog.findUnique({
    where: { id },
    select: {
      id: true,
      unitId: true,
      tanggal: true,
    },
  });

  if (!fuelLog) return actionWarning(formData, "Catatan BBM tidak ditemukan.", path);

  await prisma.fuelLog.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "FUEL_LOG",
    entityId: fuelLog.id,
    metadata: { unitId: fuelLog.unitId, tanggal: fuelLog.tanggal.toISOString().slice(0, 10) },
  });

  revalidatePath(path);
  actionSuccess(formData, "Catatan BBM berhasil dihapus.", path);
};
