"use server";

import { revalidatePath } from "next/cache";
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

const dateValue = (formData: FormData, key: string) => {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mobilisasiStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "Dalam Perjalanan" || raw === "Selesai" || raw === "Dibatalkan") return raw;
  return "Direncanakan";
};

const toId = (formData: FormData) => Number(value(formData, "id"));

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const savePath = (formData: FormData, message: string) => {
  const path = "/mobilisasi";
  revalidatePath(path);
  actionSuccess(formData, message, path);
};

const warnPrismaError = (formData: FormData, error: unknown) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Nomor mobilisasi sudah dipakai data lain.", "/mobilisasi");
  }

  console.error(error);
  return actionError(formData, "Data mobilisasi gagal disimpan. Cek kembali isian form.", "/mobilisasi");
};

export const createMobilisasiAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("mobilisasi", "create");

  if (!currentUser) {
    return actionError(formData, "Anda tidak punya akses membuat mobilisasi.", "/mobilisasi");
  }

  const noMobilisasi = value(formData, "noMobilisasi").toUpperCase();
  const unitId = nullableNumberValue(formData, "unitId");
  const asalLokasi = value(formData, "asalLokasi");
  const tujuanLokasi = value(formData, "tujuanLokasi");
  const tanggalBerangkat = dateValue(formData, "tanggalBerangkat");
  const tanggalTiba = dateValue(formData, "tanggalTiba");

  if (!noMobilisasi || !unitId || !asalLokasi || !tujuanLokasi || !tanggalBerangkat) {
    return actionError(formData, "No. mobilisasi, unit, asal, tujuan, dan tanggal berangkat wajib diisi.", "/mobilisasi");
  }
  if (tanggalTiba && tanggalTiba < tanggalBerangkat) {
    return actionError(formData, "Tanggal tiba tidak boleh lebih awal dari tanggal berangkat.", "/mobilisasi");
  }

  let mobilisasi;
  try {
    mobilisasi = await prisma.mobilisasi.create({
      data: {
        noMobilisasi,
        unitId,
        driverId: nullableNumberValue(formData, "driverId"),
        contractId: nullableNumberValue(formData, "contractId"),
        asalLokasi,
        tujuanLokasi,
        tanggalBerangkat,
        tanggalTiba,
        biayaMobilisasi: String(nullableNumberValue(formData, "biayaMobilisasi") ?? 0),
        biayaDemobilisasi: String(nullableNumberValue(formData, "biayaDemobilisasi") ?? 0),
        status: mobilisasiStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "MOBILISASI",
    entityId: mobilisasi.id,
    metadata: {
      noMobilisasi: mobilisasi.noMobilisasi,
      status: mobilisasi.status,
    },
  });

  savePath(formData, "Order mobilisasi berhasil dibuat.");
};

export const updateMobilisasiAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("mobilisasi", "edit");

  if (!currentUser) {
    return actionError(formData, "Anda tidak punya akses edit mobilisasi.", "/mobilisasi");
  }

  const id = toId(formData);
  const noMobilisasi = value(formData, "noMobilisasi").toUpperCase();
  const unitId = nullableNumberValue(formData, "unitId");
  const asalLokasi = value(formData, "asalLokasi");
  const tujuanLokasi = value(formData, "tujuanLokasi");
  const tanggalBerangkat = dateValue(formData, "tanggalBerangkat");
  const tanggalTiba = dateValue(formData, "tanggalTiba");

  if (!id || !noMobilisasi || !unitId || !asalLokasi || !tujuanLokasi || !tanggalBerangkat) {
    return actionError(formData, "Data mobilisasi tidak valid.", "/mobilisasi");
  }
  if (tanggalTiba && tanggalTiba < tanggalBerangkat) {
    return actionError(formData, "Tanggal tiba tidak boleh lebih awal dari tanggal berangkat.", "/mobilisasi");
  }

  let mobilisasi;
  try {
    mobilisasi = await prisma.mobilisasi.update({
      where: { id },
      data: {
        noMobilisasi,
        unitId,
        driverId: nullableNumberValue(formData, "driverId"),
        contractId: nullableNumberValue(formData, "contractId"),
        asalLokasi,
        tujuanLokasi,
        tanggalBerangkat,
        tanggalTiba,
        biayaMobilisasi: String(nullableNumberValue(formData, "biayaMobilisasi") ?? 0),
        biayaDemobilisasi: String(nullableNumberValue(formData, "biayaDemobilisasi") ?? 0),
        status: mobilisasiStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "MOBILISASI",
    entityId: mobilisasi.id,
    metadata: {
      noMobilisasi: mobilisasi.noMobilisasi,
      status: mobilisasi.status,
    },
  });

  savePath(formData, "Mobilisasi berhasil diperbarui.");
};

export const deleteMobilisasiAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("mobilisasi", "delete");

  if (!currentUser) {
    return actionError(formData, "Anda tidak punya akses hapus mobilisasi.", "/mobilisasi");
  }

  const id = toId(formData);
  if (!id) return actionError(formData, "Mobilisasi tidak valid.", "/mobilisasi");

  const mobilisasi = await prisma.mobilisasi.findUnique({
    where: { id },
    select: {
      id: true,
      noMobilisasi: true,
      status: true,
    },
  });

  if (!mobilisasi) return actionWarning(formData, "Mobilisasi tidak ditemukan.", "/mobilisasi");
  if (mobilisasi.status === "Selesai") {
    return actionWarning(formData, "Mobilisasi yang sudah selesai tidak bisa dihapus.", "/mobilisasi");
  }

  await prisma.mobilisasi.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "MOBILISASI",
    entityId: mobilisasi.id,
    metadata: {
      noMobilisasi: mobilisasi.noMobilisasi,
      status: mobilisasi.status,
    },
  });

  savePath(formData, "Mobilisasi berhasil dihapus.");
};
