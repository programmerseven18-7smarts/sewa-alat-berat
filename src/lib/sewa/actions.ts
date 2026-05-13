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

const requestStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "Diproses" || raw === "Ditolak" || raw === "Deal") return raw;
  return "Pending";
};

const quotationStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "Terkirim" || raw === "Disetujui" || raw === "Ditolak" || raw === "Expired") return raw;
  return "Draft";
};

const contractStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "Selesai" || raw === "Dibatalkan" || raw === "Diperpanjang") return raw;
  return "Aktif";
};

const toId = (formData: FormData) => Number(value(formData, "id"));

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const savePath = (path: string, formData: FormData, message: string) => {
  revalidatePath(path);
  actionSuccess(formData, message, path);
};

const warnPrismaError = (formData: FormData, error: unknown, path: string) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Nomor dokumen sudah dipakai data lain.", path);
  }

  console.error(error);
  return actionError(formData, "Data gagal disimpan. Cek kembali isian form.", path);
};

export const createRentalRequestAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("permintaan_sewa", "create");
  const path = "/sewa/permintaan";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat permintaan sewa.", path);

  const noPermintaan = value(formData, "noPermintaan").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");

  if (!noPermintaan || !customerId || !tanggal) {
    return actionError(formData, "No. permintaan, customer, dan tanggal wajib diisi.", path);
  }

  const mulaiSewa = dateValue(formData, "mulaiSewa");
  const akhirSewa = dateValue(formData, "akhirSewa");

  if (mulaiSewa && akhirSewa && akhirSewa < mulaiSewa) {
    return actionError(formData, "Akhir sewa tidak boleh lebih awal dari mulai sewa.", path);
  }

  let rentalRequest;
  try {
    rentalRequest = await prisma.rentalRequest.create({
      data: {
        noPermintaan,
        customerId,
        tanggal,
        lokasi: nullableValue(formData, "lokasi"),
        jenisAlat: nullableValue(formData, "jenisAlat"),
        mulaiSewa,
        akhirSewa,
        estimasiJam: nullableNumberValue(formData, "estimasiJam") === null
          ? null
          : String(nullableNumberValue(formData, "estimasiJam")),
        status: requestStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "RENTAL_REQUEST",
    entityId: rentalRequest.id,
    metadata: {
      noPermintaan: rentalRequest.noPermintaan,
      status: rentalRequest.status,
    },
  });

  savePath(path, formData, "Permintaan sewa berhasil ditambahkan.");
};

export const updateRentalRequestAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("permintaan_sewa", "edit");
  const path = "/sewa/permintaan";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit permintaan sewa.", path);

  const id = toId(formData);
  const noPermintaan = value(formData, "noPermintaan").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");

  if (!id || !noPermintaan || !customerId || !tanggal) {
    return actionError(formData, "Data permintaan sewa tidak valid.", path);
  }

  const mulaiSewa = dateValue(formData, "mulaiSewa");
  const akhirSewa = dateValue(formData, "akhirSewa");
  const estimasiJam = nullableNumberValue(formData, "estimasiJam");

  if (mulaiSewa && akhirSewa && akhirSewa < mulaiSewa) {
    return actionError(formData, "Akhir sewa tidak boleh lebih awal dari mulai sewa.", path);
  }

  let rentalRequest;
  try {
    rentalRequest = await prisma.rentalRequest.update({
      where: { id },
      data: {
        noPermintaan,
        customerId,
        tanggal,
        lokasi: nullableValue(formData, "lokasi"),
        jenisAlat: nullableValue(formData, "jenisAlat"),
        mulaiSewa,
        akhirSewa,
        estimasiJam: estimasiJam === null ? null : String(estimasiJam),
        status: requestStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "RENTAL_REQUEST",
    entityId: rentalRequest.id,
    metadata: {
      noPermintaan: rentalRequest.noPermintaan,
      status: rentalRequest.status,
    },
  });

  savePath(path, formData, "Permintaan sewa berhasil diperbarui.");
};

export const deleteRentalRequestAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("permintaan_sewa", "delete");
  const path = "/sewa/permintaan";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus permintaan sewa.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Permintaan sewa tidak valid.", path);

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id },
    select: {
      id: true,
      noPermintaan: true,
      status: true,
    },
  });

  if (!rentalRequest) return actionWarning(formData, "Permintaan sewa tidak ditemukan.", path);
  if (rentalRequest.status === "Deal") {
    return actionWarning(formData, "Permintaan yang sudah deal tidak bisa dihapus.", path);
  }

  await prisma.rentalRequest.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "RENTAL_REQUEST",
    entityId: rentalRequest.id,
    metadata: {
      noPermintaan: rentalRequest.noPermintaan,
      status: rentalRequest.status,
    },
  });

  savePath(path, formData, "Permintaan sewa berhasil dihapus.");
};

export const createQuotationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("penawaran_sewa", "create");
  const path = "/sewa/penawaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat penawaran.", path);

  const noPenawaran = value(formData, "noPenawaran").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");
  const tarif = nullableNumberValue(formData, "tarif") ?? 0;
  const estimasiTotal = nullableNumberValue(formData, "estimasiTotal") ?? 0;

  if (!noPenawaran || !customerId || !tanggal) {
    return actionError(formData, "No. penawaran, customer, dan tanggal wajib diisi.", path);
  }

  let quotation;
  try {
    quotation = await prisma.quotation.create({
      data: {
        noPenawaran,
        customerId,
        tanggal,
        berlakuHingga: dateValue(formData, "berlakuHingga"),
        unitId: nullableNumberValue(formData, "unitId"),
        tarif: String(tarif),
        satuan: nullableValue(formData, "satuan"),
        estimasiTotal: String(estimasiTotal),
        status: quotationStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "QUOTATION",
    entityId: quotation.id,
    metadata: {
      noPenawaran: quotation.noPenawaran,
      status: quotation.status,
    },
  });

  savePath(path, formData, "Penawaran berhasil dibuat.");
};

export const updateQuotationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("penawaran_sewa", "edit");
  const path = "/sewa/penawaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit penawaran.", path);

  const id = toId(formData);
  const noPenawaran = value(formData, "noPenawaran").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");
  const tarif = nullableNumberValue(formData, "tarif") ?? 0;
  const estimasiTotal = nullableNumberValue(formData, "estimasiTotal") ?? 0;

  if (!id || !noPenawaran || !customerId || !tanggal) {
    return actionError(formData, "Data penawaran tidak valid.", path);
  }

  let quotation;
  try {
    quotation = await prisma.quotation.update({
      where: { id },
      data: {
        noPenawaran,
        customerId,
        tanggal,
        berlakuHingga: dateValue(formData, "berlakuHingga"),
        unitId: nullableNumberValue(formData, "unitId"),
        tarif: String(tarif),
        satuan: nullableValue(formData, "satuan"),
        estimasiTotal: String(estimasiTotal),
        status: quotationStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "QUOTATION",
    entityId: quotation.id,
    metadata: {
      noPenawaran: quotation.noPenawaran,
      status: quotation.status,
    },
  });

  savePath(path, formData, "Penawaran berhasil diperbarui.");
};

export const deleteQuotationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("penawaran_sewa", "delete");
  const path = "/sewa/penawaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus penawaran.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Penawaran tidak valid.", path);

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: {
      id: true,
      noPenawaran: true,
      status: true,
    },
  });

  if (!quotation) return actionWarning(formData, "Penawaran tidak ditemukan.", path);
  if (quotation.status === "Disetujui") {
    return actionWarning(formData, "Penawaran yang sudah disetujui tidak bisa dihapus.", path);
  }

  await prisma.quotation.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "QUOTATION",
    entityId: quotation.id,
    metadata: {
      noPenawaran: quotation.noPenawaran,
      status: quotation.status,
    },
  });

  savePath(path, formData, "Penawaran berhasil dihapus.");
};

export const createRentalContractAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kontrak_sewa", "create");
  const path = "/sewa/kontrak";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat kontrak.", path);

  const noKontrak = value(formData, "noKontrak").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const unitId = nullableNumberValue(formData, "unitId");
  const tanggalKontrak = dateValue(formData, "tanggalKontrak");
  const mulaiSewa = dateValue(formData, "mulaiSewa");
  const akhirSewa = dateValue(formData, "akhirSewa");
  const tarif = nullableNumberValue(formData, "tarif") ?? 0;
  const nilaiKontrak = nullableNumberValue(formData, "nilaiKontrak") ?? 0;
  const dp = nullableNumberValue(formData, "dp") ?? 0;

  if (!noKontrak || !customerId || !unitId || !tanggalKontrak || !mulaiSewa) {
    return actionError(formData, "No. kontrak, customer, unit, tanggal kontrak, dan mulai sewa wajib diisi.", path);
  }
  if (akhirSewa && akhirSewa < mulaiSewa) {
    return actionError(formData, "Akhir sewa tidak boleh lebih awal dari mulai sewa.", path);
  }

  let contract;
  try {
    contract = await prisma.rentalContract.create({
      data: {
        noKontrak,
        customerId,
        unitId,
        operatorId: nullableNumberValue(formData, "operatorId"),
        locationId: nullableNumberValue(formData, "locationId"),
        tanggalKontrak,
        mulaiSewa,
        akhirSewa,
        tarif: String(tarif),
        satuan: value(formData, "satuan") || "Hari",
        nilaiKontrak: String(nilaiKontrak),
        dp: String(dp),
        status: contractStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "RENTAL_CONTRACT",
    entityId: contract.id,
    metadata: {
      noKontrak: contract.noKontrak,
      status: contract.status,
    },
  });

  savePath(path, formData, "Kontrak sewa berhasil dibuat.");
};

export const updateRentalContractAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kontrak_sewa", "edit");
  const path = "/sewa/kontrak";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit kontrak.", path);

  const id = toId(formData);
  const noKontrak = value(formData, "noKontrak").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const unitId = nullableNumberValue(formData, "unitId");
  const tanggalKontrak = dateValue(formData, "tanggalKontrak");
  const mulaiSewa = dateValue(formData, "mulaiSewa");
  const akhirSewa = dateValue(formData, "akhirSewa");
  const tarif = nullableNumberValue(formData, "tarif") ?? 0;
  const nilaiKontrak = nullableNumberValue(formData, "nilaiKontrak") ?? 0;
  const dp = nullableNumberValue(formData, "dp") ?? 0;

  if (!id || !noKontrak || !customerId || !unitId || !tanggalKontrak || !mulaiSewa) {
    return actionError(formData, "Data kontrak sewa tidak valid.", path);
  }
  if (akhirSewa && akhirSewa < mulaiSewa) {
    return actionError(formData, "Akhir sewa tidak boleh lebih awal dari mulai sewa.", path);
  }

  let contract;
  try {
    contract = await prisma.rentalContract.update({
      where: { id },
      data: {
        noKontrak,
        customerId,
        unitId,
        operatorId: nullableNumberValue(formData, "operatorId"),
        locationId: nullableNumberValue(formData, "locationId"),
        tanggalKontrak,
        mulaiSewa,
        akhirSewa,
        tarif: String(tarif),
        satuan: value(formData, "satuan") || "Hari",
        nilaiKontrak: String(nilaiKontrak),
        dp: String(dp),
        status: contractStatus(formData),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "RENTAL_CONTRACT",
    entityId: contract.id,
    metadata: {
      noKontrak: contract.noKontrak,
      status: contract.status,
    },
  });

  savePath(path, formData, "Kontrak sewa berhasil diperbarui.");
};

export const deleteRentalContractAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kontrak_sewa", "delete");
  const path = "/sewa/kontrak";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus kontrak.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Kontrak sewa tidak valid.", path);

  const contract = await prisma.rentalContract.findUnique({
    where: { id },
    select: {
      id: true,
      noKontrak: true,
      status: true,
      _count: {
        select: {
          dailyReports: true,
          fuelLogs: true,
          invoices: true,
          mobilisasi: true,
        },
      },
    },
  });

  if (!contract) return actionWarning(formData, "Kontrak sewa tidak ditemukan.", path);

  const usedCount = Object.values(contract._count).reduce((total, count) => total + count, 0);
  if (usedCount > 0) {
    return actionWarning(formData, "Kontrak sudah dipakai laporan, invoice, BBM, atau mobilisasi, jadi belum bisa dihapus.", path);
  }

  await prisma.rentalContract.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "RENTAL_CONTRACT",
    entityId: contract.id,
    metadata: {
      noKontrak: contract.noKontrak,
      status: contract.status,
    },
  });

  savePath(path, formData, "Kontrak sewa berhasil dihapus.");
};
