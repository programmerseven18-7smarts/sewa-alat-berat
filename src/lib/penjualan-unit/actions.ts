"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
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

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const warnPrismaError = (formData: FormData, error: unknown, path: string) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Nomor laporan sudah dipakai data lain.", path);
  }

  console.error(error);
  return actionError(formData, "Data penjualan unit gagal disimpan. Cek kembali isian form.", path);
};

const payload = (formData: FormData) => {
  const hppPembelian = numberValue(formData, "hppPembelian");
  const biayaPerbaikan = numberValue(formData, "biayaPerbaikan");
  const biayaMekanik = numberValue(formData, "biayaMekanik");
  const biayaCat = numberValue(formData, "biayaCat");
  const biayaLas = numberValue(formData, "biayaLas");
  const biayaKebersihan = numberValue(formData, "biayaKebersihan");
  const totalHpp = hppPembelian + biayaPerbaikan + biayaMekanik + biayaCat + biayaLas + biayaKebersihan;
  const hargaJual = nullableNumberValue(formData, "hargaJual");
  const labaRugi = hargaJual == null ? null : hargaJual - totalHpp;

  return {
    hppPembelian,
    biayaPerbaikan,
    biayaMekanik,
    biayaCat,
    biayaLas,
    biayaKebersihan,
    totalHpp,
    hargaJual,
    labaRugi,
  };
};

const revalidateSalesPaths = () => {
  revalidatePath("/penjualan-unit/hpp");
  revalidatePath("/penjualan-unit/penjualan");
  revalidatePath("/laporan/hpp-unit");
};

const actionPath = async () => {
  const referer = (await headers()).get("referer") ?? "";
  return referer.includes("/penjualan-unit/penjualan")
    ? "/penjualan-unit/penjualan"
    : "/penjualan-unit/hpp";
};

const savePath = (path: string, formData: FormData, message: string) => {
  revalidateSalesPaths();
  actionSuccess(formData, message, path);
};

export const createUnitSaleHppAction = async (formData: FormData) => {
  const currentUser =
    (await getAuthorizedUser("hpp_unit", "create")) ??
    (await getAuthorizedUser("penjualan_unit", "create"));
  const path = await actionPath();

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat laporan HPP.", path);

  const unitId = nullableNumberValue(formData, "unitId");
  const noLaporan = value(formData, "noLaporan").toUpperCase();
  const tanggal = dateValue(formData, "tanggal");
  const data = payload(formData);

  if (!unitId || !noLaporan || !tanggal) {
    return actionError(formData, "Unit, no. laporan, dan tanggal wajib diisi.", path);
  }
  if (
    data.hppPembelian < 0 ||
    data.biayaPerbaikan < 0 ||
    data.biayaMekanik < 0 ||
    data.biayaCat < 0 ||
    data.biayaLas < 0 ||
    data.biayaKebersihan < 0 ||
    (data.hargaJual != null && data.hargaJual < 0)
  ) {
    return actionError(formData, "Komponen biaya tidak boleh minus.", path);
  }

  let report;
  try {
    report = await prisma.unitSaleHpp.create({
      data: {
        unitId,
        noLaporan,
        tanggal,
        hppPembelian: String(data.hppPembelian),
        biayaPerbaikan: String(data.biayaPerbaikan),
        biayaMekanik: String(data.biayaMekanik),
        biayaCat: String(data.biayaCat),
        biayaLas: String(data.biayaLas),
        biayaKebersihan: String(data.biayaKebersihan),
        totalHpp: String(data.totalHpp),
        hargaJual: data.hargaJual == null ? null : String(data.hargaJual),
        labaRugi: data.labaRugi == null ? null : String(data.labaRugi),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "UNIT_SALE_HPP",
    entityId: report.id,
    metadata: { noLaporan: report.noLaporan, unitId: report.unitId },
  });

  savePath(path, formData, "Laporan HPP berhasil dibuat.");
};

export const updateUnitSaleHppAction = async (formData: FormData) => {
  const currentUser =
    (await getAuthorizedUser("hpp_unit", "edit")) ??
    (await getAuthorizedUser("penjualan_unit", "edit"));
  const path = await actionPath();

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit laporan HPP.", path);

  const id = toId(formData);
  const unitId = nullableNumberValue(formData, "unitId");
  const noLaporan = value(formData, "noLaporan").toUpperCase();
  const tanggal = dateValue(formData, "tanggal");
  const data = payload(formData);

  if (!id || !unitId || !noLaporan || !tanggal) {
    return actionError(formData, "Data laporan HPP tidak valid.", path);
  }
  if (
    data.hppPembelian < 0 ||
    data.biayaPerbaikan < 0 ||
    data.biayaMekanik < 0 ||
    data.biayaCat < 0 ||
    data.biayaLas < 0 ||
    data.biayaKebersihan < 0 ||
    (data.hargaJual != null && data.hargaJual < 0)
  ) {
    return actionError(formData, "Komponen biaya tidak boleh minus.", path);
  }

  let report;
  try {
    report = await prisma.unitSaleHpp.update({
      where: { id },
      data: {
        unitId,
        noLaporan,
        tanggal,
        hppPembelian: String(data.hppPembelian),
        biayaPerbaikan: String(data.biayaPerbaikan),
        biayaMekanik: String(data.biayaMekanik),
        biayaCat: String(data.biayaCat),
        biayaLas: String(data.biayaLas),
        biayaKebersihan: String(data.biayaKebersihan),
        totalHpp: String(data.totalHpp),
        hargaJual: data.hargaJual == null ? null : String(data.hargaJual),
        labaRugi: data.labaRugi == null ? null : String(data.labaRugi),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "UNIT_SALE_HPP",
    entityId: report.id,
    metadata: { noLaporan: report.noLaporan, unitId: report.unitId },
  });

  savePath(path, formData, "Laporan HPP berhasil diperbarui.");
};

export const deleteUnitSaleHppAction = async (formData: FormData) => {
  const currentUser =
    (await getAuthorizedUser("hpp_unit", "edit")) ??
    (await getAuthorizedUser("penjualan_unit", "edit"));
  const path = await actionPath();

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus laporan HPP.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Laporan HPP tidak valid.", path);

  const report = await prisma.unitSaleHpp.findUnique({
    where: { id },
    select: {
      id: true,
      noLaporan: true,
    },
  });

  if (!report) return actionWarning(formData, "Laporan HPP tidak ditemukan.", path);

  await prisma.unitSaleHpp.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "UNIT_SALE_HPP",
    entityId: report.id,
    metadata: { noLaporan: report.noLaporan },
  });

  savePath(path, formData, "Laporan HPP berhasil dihapus.");
};
