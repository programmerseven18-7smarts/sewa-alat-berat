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

const numberValue = (formData: FormData, key: string) =>
  nullableNumberValue(formData, key) ?? 0;

const dateValue = (formData: FormData, key: string) => {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toId = (formData: FormData) => Number(value(formData, "id"));

const maintenanceType = (formData: FormData) => {
  const raw = value(formData, "tipe");
  if (raw === "Preventive" || raw === "Corrective" || raw === "Breakdown") return raw;
  return "Rutin";
};

const maintenanceStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "In Progress" || raw === "Done" || raw === "Cancel") return raw;
  return "Open";
};

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const warnPrismaError = (formData: FormData, error: unknown, path: string) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Nomor work order sudah dipakai data lain.", path);
  }

  console.error(error);
  return actionError(formData, "Data maintenance gagal disimpan. Cek kembali isian form.", path);
};

const revalidateMaintenancePaths = () => {
  revalidatePath("/maintenance/work-order");
  revalidatePath("/maintenance/jadwal");
  revalidatePath("/maintenance/riwayat");
  revalidatePath("/maintenance/biaya");
  revalidatePath("/laporan/maintenance");
  revalidatePath("/rekap/maintenance");
};

const savePath = (formData: FormData, message: string) => {
  revalidateMaintenancePaths();
  actionSuccess(formData, message, "/maintenance/work-order");
};

const recalcMaintenanceOrderTotal = async (
  maintenanceOrderId: number,
  tx: Prisma.TransactionClient
) => {
  const aggregate = await tx.maintenancePart.aggregate({
    where: { maintenanceOrderId },
    _sum: { total: true },
  });

  await tx.maintenanceOrder.update({
    where: { id: maintenanceOrderId },
    data: {
      totalBiaya: String(Number(aggregate._sum.total ?? 0)),
    },
  });
};

const getSparepartDefaults = async (
  sparepartId: number | null,
  tx: Prisma.TransactionClient
) => {
  if (!sparepartId) return null;

  return tx.sparepart.findUnique({
    where: { id: sparepartId },
    select: {
      nama: true,
      satuan: true,
      hargaSatuan: true,
      supplier: {
        select: {
          nama: true,
        },
      },
    },
  });
};

export const createMaintenanceOrderAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "create");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat work order.", path);

  const noWo = value(formData, "noWo").toUpperCase();
  const unitId = nullableNumberValue(formData, "unitId");
  const deskripsi = value(formData, "deskripsi");
  const totalBiaya = numberValue(formData, "totalBiaya");

  if (!noWo || !unitId || !deskripsi) {
    return actionError(formData, "No. WO, unit, dan deskripsi wajib diisi.", path);
  }
  if (totalBiaya < 0) return actionError(formData, "Total biaya tidak boleh minus.", path);

  let order;
  try {
    order = await prisma.maintenanceOrder.create({
      data: {
        noWo,
        unitId,
        tipe: maintenanceType(formData),
        tanggalMulai: dateValue(formData, "tanggalMulai"),
        tanggalSelesai: dateValue(formData, "tanggalSelesai"),
        hmService: nullableNumberValue(formData, "hmService")?.toString(),
        deskripsi,
        mekanik: nullableValue(formData, "mekanik"),
        supplierId: nullableNumberValue(formData, "supplierId"),
        status: maintenanceStatus(formData),
        totalBiaya: String(totalBiaya),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "MAINTENANCE_ORDER",
    entityId: order.id,
    metadata: { noWo: order.noWo, unitId: order.unitId },
  });

  savePath(formData, "Work order berhasil dibuat.");
};

export const updateMaintenanceOrderAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "edit");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit work order.", path);

  const id = toId(formData);
  const noWo = value(formData, "noWo").toUpperCase();
  const unitId = nullableNumberValue(formData, "unitId");
  const deskripsi = value(formData, "deskripsi");
  const totalBiaya = numberValue(formData, "totalBiaya");

  if (!id || !noWo || !unitId || !deskripsi) {
    return actionError(formData, "Data work order tidak valid.", path);
  }
  if (totalBiaya < 0) return actionError(formData, "Total biaya tidak boleh minus.", path);

  let order;
  try {
    order = await prisma.maintenanceOrder.update({
      where: { id },
      data: {
        noWo,
        unitId,
        tipe: maintenanceType(formData),
        tanggalMulai: dateValue(formData, "tanggalMulai"),
        tanggalSelesai: dateValue(formData, "tanggalSelesai"),
        hmService: nullableNumberValue(formData, "hmService")?.toString(),
        deskripsi,
        mekanik: nullableValue(formData, "mekanik"),
        supplierId: nullableNumberValue(formData, "supplierId"),
        status: maintenanceStatus(formData),
        totalBiaya: String(totalBiaya),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "MAINTENANCE_ORDER",
    entityId: order.id,
    metadata: { noWo: order.noWo, unitId: order.unitId },
  });

  savePath(formData, "Work order berhasil diperbarui.");
};

export const deleteMaintenanceOrderAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "delete");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus work order.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Work order tidak valid.", path);

  const order = await prisma.maintenanceOrder.findUnique({
    where: { id },
    select: {
      id: true,
      noWo: true,
      _count: {
        select: {
          maintenanceParts: true,
        },
      },
    },
  });

  if (!order) return actionWarning(formData, "Work order tidak ditemukan.", path);
  if (order._count.maintenanceParts > 0) {
    return actionWarning(formData, "Work order sudah memiliki detail part, jadi belum bisa dihapus.", path);
  }

  await prisma.maintenanceOrder.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "MAINTENANCE_ORDER",
    entityId: order.id,
    metadata: { noWo: order.noWo },
  });

  savePath(formData, "Work order berhasil dihapus.");
};

export const createMaintenancePartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "edit");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses mengubah detail part.", path);

  const maintenanceOrderId = nullableNumberValue(formData, "maintenanceOrderId");
  const sparepartId = nullableNumberValue(formData, "sparepartId");
  const qty = numberValue(formData, "qty");

  if (!maintenanceOrderId) return actionError(formData, "Work order wajib dipilih.", path);
  if (qty <= 0) return actionError(formData, "Qty harus lebih dari 0.", path);

  let part;
  try {
    part = await prisma.$transaction(async (tx) => {
      const sparepart = await getSparepartDefaults(sparepartId, tx);
      const namaPart = value(formData, "namaPart") || sparepart?.nama || "";
      const harga = nullableNumberValue(formData, "harga") ?? Number(sparepart?.hargaSatuan ?? 0);
      const satuan = nullableValue(formData, "satuan") || sparepart?.satuan || null;
      const supplierNama = nullableValue(formData, "supplierNama") || sparepart?.supplier?.nama || null;
      const total = harga * qty;

      if (!namaPart) throw new Error("Nama part wajib diisi.");
      if (harga < 0) throw new Error("Harga part tidak boleh minus.");

      const created = await tx.maintenancePart.create({
        data: {
          maintenanceOrderId,
          sparepartId,
          namaPart,
          supplierNama,
          harga: String(harga),
          qty: String(qty),
          satuan,
          total: String(total),
          fotoUrl: nullableValue(formData, "fotoUrl"),
        },
      });

      await recalcMaintenanceOrderTotal(maintenanceOrderId, tx);
      return created;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Nama part wajib diisi.") {
      return actionError(formData, error.message, path);
    }
    if (error instanceof Error && error.message === "Harga part tidak boleh minus.") {
      return actionError(formData, error.message, path);
    }
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "MAINTENANCE_PART",
    entityId: part.id,
    metadata: { maintenanceOrderId: part.maintenanceOrderId, namaPart: part.namaPart },
  });

  savePath(formData, "Detail part berhasil ditambahkan.");
};

export const updateMaintenancePartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "edit");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses mengubah detail part.", path);

  const id = toId(formData);
  const maintenanceOrderId = nullableNumberValue(formData, "maintenanceOrderId");
  const sparepartId = nullableNumberValue(formData, "sparepartId");
  const qty = numberValue(formData, "qty");

  if (!id || !maintenanceOrderId) return actionError(formData, "Detail part tidak valid.", path);
  if (qty <= 0) return actionError(formData, "Qty harus lebih dari 0.", path);

  let part;
  try {
    part = await prisma.$transaction(async (tx) => {
      const existing = await tx.maintenancePart.findUnique({
        where: { id },
        select: { maintenanceOrderId: true },
      });
      const sparepart = await getSparepartDefaults(sparepartId, tx);
      const namaPart = value(formData, "namaPart") || sparepart?.nama || "";
      const harga = nullableNumberValue(formData, "harga") ?? Number(sparepart?.hargaSatuan ?? 0);
      const satuan = nullableValue(formData, "satuan") || sparepart?.satuan || null;
      const supplierNama = nullableValue(formData, "supplierNama") || sparepart?.supplier?.nama || null;
      const total = harga * qty;

      if (!namaPart) throw new Error("Nama part wajib diisi.");
      if (harga < 0) throw new Error("Harga part tidak boleh minus.");

      const updated = await tx.maintenancePart.update({
        where: { id },
        data: {
          maintenanceOrderId,
          sparepartId,
          namaPart,
          supplierNama,
          harga: String(harga),
          qty: String(qty),
          satuan,
          total: String(total),
          fotoUrl: nullableValue(formData, "fotoUrl"),
        },
      });

      if (existing && existing.maintenanceOrderId !== maintenanceOrderId) {
        await recalcMaintenanceOrderTotal(existing.maintenanceOrderId, tx);
      }
      await recalcMaintenanceOrderTotal(maintenanceOrderId, tx);
      return updated;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Nama part wajib diisi.") {
      return actionError(formData, error.message, path);
    }
    if (error instanceof Error && error.message === "Harga part tidak boleh minus.") {
      return actionError(formData, error.message, path);
    }
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "MAINTENANCE_PART",
    entityId: part.id,
    metadata: { maintenanceOrderId: part.maintenanceOrderId, namaPart: part.namaPart },
  });

  savePath(formData, "Detail part berhasil diperbarui.");
};

export const deleteMaintenancePartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("work_order_maintenance", "edit");
  const path = "/maintenance/work-order";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses menghapus detail part.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Detail part tidak valid.", path);

  const part = await prisma.maintenancePart.findUnique({
    where: { id },
    select: {
      id: true,
      maintenanceOrderId: true,
      namaPart: true,
    },
  });

  if (!part) return actionWarning(formData, "Detail part tidak ditemukan.", path);

  await prisma.$transaction(async (tx) => {
    await tx.maintenancePart.delete({ where: { id } });
    await recalcMaintenanceOrderTotal(part.maintenanceOrderId, tx);
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "MAINTENANCE_PART",
    entityId: part.id,
    metadata: { maintenanceOrderId: part.maintenanceOrderId, namaPart: part.namaPart },
  });

  savePath(formData, "Detail part berhasil dihapus.");
};
