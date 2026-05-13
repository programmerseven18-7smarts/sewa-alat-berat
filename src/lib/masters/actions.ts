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

const numberValue = (formData: FormData, key: string) =>
  Number(value(formData, key) || 0);

const nullableNumberValue = (formData: FormData, key: string) => {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const upperValue = (formData: FormData, key: string) =>
  value(formData, key).toUpperCase();

const activeStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  return raw === "Nonaktif" ? "Nonaktif" : "Aktif";
};

const unitStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "On Duty" || raw === "Break Down" || raw === "Maintenance" || raw === "Mobilisasi") {
    return raw;
  }
  return "Stand By";
};

const toId = (formData: FormData) => Number(value(formData, "id"));

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const savePath = (path: string, formData: FormData, message = "Data berhasil disimpan.") => {
  revalidatePath(path);
  actionSuccess(formData, message, path);
};

const warnPrismaError = (formData: FormData, error: unknown, path: string) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Kode sudah dipakai data lain.", path);
  }

  console.error(error);
  return actionError(formData, "Data gagal disimpan. Cek kembali isian form.", path);
};

export const createEquipmentCategoryAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kategori_alat", "create");
  const path = "/master/kategori";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat kategori.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama kategori wajib diisi.", path);
  }

  let category;
  try {
    category = await prisma.equipmentCategory.create({
      data: {
        kode,
        nama,
        deskripsi: nullableValue(formData, "deskripsi"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "EQUIPMENT_CATEGORY",
    entityId: category.id,
    metadata: { kode: category.kode, nama: category.nama },
  });

  savePath(path, formData, "Kategori alat berhasil ditambahkan.");
};

export const updateEquipmentCategoryAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kategori_alat", "edit");
  const path = "/master/kategori";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit kategori.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data kategori tidak valid.", path);
  }

  let category;
  try {
    category = await prisma.equipmentCategory.update({
      where: { id },
      data: {
        kode,
        nama,
        deskripsi: nullableValue(formData, "deskripsi"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "EQUIPMENT_CATEGORY",
    entityId: category.id,
    metadata: { kode: category.kode, nama: category.nama },
  });

  savePath(path, formData, "Kategori alat berhasil diperbarui.");
};

export const deleteEquipmentCategoryAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kategori_alat", "delete");
  const path = "/master/kategori";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus kategori.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Kategori tidak valid.", path);

  const category = await prisma.equipmentCategory.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          units: true,
          rentalRates: true,
        },
      },
    },
  });

  if (!category) return actionWarning(formData, "Kategori tidak ditemukan.", path);
  if (category._count.units > 0 || category._count.rentalRates > 0) {
    return actionWarning(formData, "Kategori masih dipakai unit atau tarif sewa, jadi belum bisa dihapus.", path);
  }

  await prisma.equipmentCategory.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "EQUIPMENT_CATEGORY",
    entityId: category.id,
    metadata: { kode: category.kode, nama: category.nama },
  });

  savePath(path, formData, "Kategori alat berhasil dihapus.");
};

export const createProjectLocationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("lokasi_proyek", "create");
  const path = "/master/lokasi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat lokasi.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama lokasi wajib diisi.", path);
  }

  let location;
  try {
    location = await prisma.projectLocation.create({
      data: {
        kode,
        nama,
        alamat: nullableValue(formData, "alamat"),
        kota: nullableValue(formData, "kota"),
        provinsi: nullableValue(formData, "provinsi"),
        picNama: nullableValue(formData, "picNama"),
        picTelepon: nullableValue(formData, "picTelepon"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "PROJECT_LOCATION",
    entityId: location.id,
    metadata: { kode: location.kode, nama: location.nama },
  });

  savePath(path, formData, "Lokasi proyek berhasil ditambahkan.");
};

export const updateProjectLocationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("lokasi_proyek", "edit");
  const path = "/master/lokasi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit lokasi.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data lokasi tidak valid.", path);
  }

  let location;
  try {
    location = await prisma.projectLocation.update({
      where: { id },
      data: {
        kode,
        nama,
        alamat: nullableValue(formData, "alamat"),
        kota: nullableValue(formData, "kota"),
        provinsi: nullableValue(formData, "provinsi"),
        picNama: nullableValue(formData, "picNama"),
        picTelepon: nullableValue(formData, "picTelepon"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "PROJECT_LOCATION",
    entityId: location.id,
    metadata: { kode: location.kode, nama: location.nama },
  });

  savePath(path, formData, "Lokasi proyek berhasil diperbarui.");
};

export const deleteProjectLocationAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("lokasi_proyek", "delete");
  const path = "/master/lokasi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus lokasi.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Lokasi tidak valid.", path);

  const location = await prisma.projectLocation.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          units: true,
          rentalContracts: true,
        },
      },
    },
  });

  if (!location) return actionWarning(formData, "Lokasi tidak ditemukan.", path);
  if (location._count.units > 0 || location._count.rentalContracts > 0) {
    return actionWarning(formData, "Lokasi masih dipakai unit atau kontrak, jadi belum bisa dihapus.", path);
  }

  await prisma.projectLocation.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "PROJECT_LOCATION",
    entityId: location.id,
    metadata: { kode: location.kode, nama: location.nama },
  });

  savePath(path, formData, "Lokasi proyek berhasil dihapus.");
};

export const createRentalRateAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("tarif_sewa", "create");
  const path = "/master/tarif-sewa";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat tarif sewa.", path);

  const nama = value(formData, "nama");
  const satuan = value(formData, "satuan");
  const tarif = numberValue(formData, "tarif");

  if (!nama || !satuan || tarif <= 0) {
    return actionError(formData, "Nama, satuan, dan tarif wajib diisi.", path);
  }

  const rate = await prisma.rentalRate.create({
    data: {
      categoryId: nullableNumberValue(formData, "categoryId"),
      nama,
      satuan,
      tarif: String(tarif),
      minimum: nullableNumberValue(formData, "minimum") === null
        ? null
        : String(nullableNumberValue(formData, "minimum")),
      catatan: nullableValue(formData, "catatan"),
    },
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "RENTAL_RATE",
    entityId: rate.id,
    metadata: { nama: rate.nama, satuan: rate.satuan },
  });

  savePath(path, formData, "Tarif sewa berhasil ditambahkan.");
};

export const updateRentalRateAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("tarif_sewa", "edit");
  const path = "/master/tarif-sewa";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit tarif sewa.", path);

  const id = toId(formData);
  const nama = value(formData, "nama");
  const satuan = value(formData, "satuan");
  const tarif = numberValue(formData, "tarif");
  const minimum = nullableNumberValue(formData, "minimum");

  if (!id || !nama || !satuan || tarif <= 0) {
    return actionError(formData, "Data tarif sewa tidak valid.", path);
  }

  const rate = await prisma.rentalRate.update({
    where: { id },
    data: {
      categoryId: nullableNumberValue(formData, "categoryId"),
      nama,
      satuan,
      tarif: String(tarif),
      minimum: minimum === null ? null : String(minimum),
      catatan: nullableValue(formData, "catatan"),
    },
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "RENTAL_RATE",
    entityId: rate.id,
    metadata: { nama: rate.nama, satuan: rate.satuan },
  });

  savePath(path, formData, "Tarif sewa berhasil diperbarui.");
};

export const deleteRentalRateAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("tarif_sewa", "delete");
  const path = "/master/tarif-sewa";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus tarif sewa.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Tarif sewa tidak valid.", path);

  const rate = await prisma.rentalRate.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      satuan: true,
    },
  });

  if (!rate) return actionWarning(formData, "Tarif sewa tidak ditemukan.", path);

  await prisma.rentalRate.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "RENTAL_RATE",
    entityId: rate.id,
    metadata: { nama: rate.nama, satuan: rate.satuan },
  });

  savePath(path, formData, "Tarif sewa berhasil dihapus.");
};

export const createCustomerAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("customer", "create");
  const path = "/master/customer";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat customer.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama customer wajib diisi.", path);
  }

  let customer;
  try {
    customer = await prisma.customer.create({
      data: {
        kode,
        nama,
        picNama: nullableValue(formData, "picNama"),
        telepon: nullableValue(formData, "telepon"),
        email: nullableValue(formData, "email"),
        alamat: nullableValue(formData, "alamat"),
        kota: nullableValue(formData, "kota"),
        npwp: nullableValue(formData, "npwp"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "CUSTOMER",
    entityId: customer.id,
    metadata: { kode: customer.kode, nama: customer.nama },
  });

  savePath(path, formData, "Customer berhasil ditambahkan.");
};

export const updateCustomerAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("customer", "edit");
  const path = "/master/customer";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit customer.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data customer tidak valid.", path);
  }

  let customer;
  try {
    customer = await prisma.customer.update({
      where: { id },
      data: {
        kode,
        nama,
        picNama: nullableValue(formData, "picNama"),
        telepon: nullableValue(formData, "telepon"),
        email: nullableValue(formData, "email"),
        alamat: nullableValue(formData, "alamat"),
        kota: nullableValue(formData, "kota"),
        npwp: nullableValue(formData, "npwp"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "CUSTOMER",
    entityId: customer.id,
    metadata: { kode: customer.kode, nama: customer.nama },
  });

  savePath(path, formData, "Customer berhasil diperbarui.");
};

export const deleteCustomerAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("customer", "delete");
  const path = "/master/customer";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus customer.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Customer tidak valid.", path);

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          invoices: true,
          quotations: true,
          rentalContracts: true,
          rentalRequests: true,
        },
      },
    },
  });

  if (!customer) return actionWarning(formData, "Customer tidak ditemukan.", path);
  if (
    customer._count.invoices > 0 ||
    customer._count.quotations > 0 ||
    customer._count.rentalContracts > 0 ||
    customer._count.rentalRequests > 0
  ) {
    return actionWarning(formData, "Customer masih dipakai transaksi sewa atau invoice, jadi belum bisa dihapus.", path);
  }

  await prisma.customer.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "CUSTOMER",
    entityId: customer.id,
    metadata: { kode: customer.kode, nama: customer.nama },
  });

  savePath(path, formData, "Customer berhasil dihapus.");
};

export const createSupplierAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("supplier", "create");
  const path = "/master/supplier";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat supplier.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama supplier wajib diisi.", path);
  }

  let supplier;
  try {
    supplier = await prisma.supplier.create({
      data: {
        kode,
        nama,
        picNama: nullableValue(formData, "picNama"),
        telepon: nullableValue(formData, "telepon"),
        email: nullableValue(formData, "email"),
        alamat: nullableValue(formData, "alamat"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "SUPPLIER",
    entityId: supplier.id,
    metadata: { kode: supplier.kode, nama: supplier.nama },
  });

  savePath(path, formData, "Supplier berhasil ditambahkan.");
};

export const updateSupplierAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("supplier", "edit");
  const path = "/master/supplier";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit supplier.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data supplier tidak valid.", path);
  }

  let supplier;
  try {
    supplier = await prisma.supplier.update({
      where: { id },
      data: {
        kode,
        nama,
        picNama: nullableValue(formData, "picNama"),
        telepon: nullableValue(formData, "telepon"),
        email: nullableValue(formData, "email"),
        alamat: nullableValue(formData, "alamat"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "SUPPLIER",
    entityId: supplier.id,
    metadata: { kode: supplier.kode, nama: supplier.nama },
  });

  savePath(path, formData, "Supplier berhasil diperbarui.");
};

export const deleteSupplierAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("supplier", "delete");
  const path = "/master/supplier";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus supplier.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Supplier tidak valid.", path);

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          maintenanceOrders: true,
          spareparts: true,
        },
      },
    },
  });

  if (!supplier) return actionWarning(formData, "Supplier tidak ditemukan.", path);
  if (supplier._count.maintenanceOrders > 0 || supplier._count.spareparts > 0) {
    return actionWarning(formData, "Supplier masih dipakai sparepart atau work order, jadi belum bisa dihapus.", path);
  }

  await prisma.supplier.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "SUPPLIER",
    entityId: supplier.id,
    metadata: { kode: supplier.kode, nama: supplier.nama },
  });

  savePath(path, formData, "Supplier berhasil dihapus.");
};

export const createDriverAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("driver", "create");
  const path = "/master/driver";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat driver.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama driver wajib diisi.", path);
  }

  let driver;
  try {
    driver = await prisma.driver.create({
      data: {
        kode,
        nama,
        noKtp: nullableValue(formData, "noKtp"),
        telepon: nullableValue(formData, "telepon"),
        noSim: nullableValue(formData, "noSim"),
        status: activeStatus(formData),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "DRIVER",
    entityId: driver.id,
    metadata: { kode: driver.kode, nama: driver.nama },
  });

  savePath(path, formData, "Driver berhasil ditambahkan.");
};

export const updateDriverAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("driver", "edit");
  const path = "/master/driver";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit driver.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data driver tidak valid.", path);
  }

  let driver;
  try {
    driver = await prisma.driver.update({
      where: { id },
      data: {
        kode,
        nama,
        noKtp: nullableValue(formData, "noKtp"),
        telepon: nullableValue(formData, "telepon"),
        noSim: nullableValue(formData, "noSim"),
        status: activeStatus(formData),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "DRIVER",
    entityId: driver.id,
    metadata: { kode: driver.kode, nama: driver.nama },
  });

  savePath(path, formData, "Driver berhasil diperbarui.");
};

export const deleteDriverAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("driver", "delete");
  const path = "/master/driver";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus driver.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Driver tidak valid.", path);

  const driver = await prisma.driver.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          mobilisasi: true,
        },
      },
    },
  });

  if (!driver) return actionWarning(formData, "Driver tidak ditemukan.", path);
  if (driver._count.mobilisasi > 0) {
    return actionWarning(formData, "Driver masih dipakai data mobilisasi, jadi belum bisa dihapus.", path);
  }

  await prisma.driver.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "DRIVER",
    entityId: driver.id,
    metadata: { kode: driver.kode, nama: driver.nama },
  });

  savePath(path, formData, "Driver berhasil dihapus.");
};

export const createOperatorAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("operator", "create");
  const path = "/master/operator";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat operator.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama operator wajib diisi.", path);
  }

  let operator;
  try {
    operator = await prisma.operator.create({
      data: {
        kode,
        nama,
        noKtp: nullableValue(formData, "noKtp"),
        telepon: nullableValue(formData, "telepon"),
        simType: nullableValue(formData, "simType"),
        simNo: nullableValue(formData, "simNo"),
        status: activeStatus(formData),
        unitId: nullableNumberValue(formData, "unitId"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "OPERATOR",
    entityId: operator.id,
    metadata: { kode: operator.kode, nama: operator.nama },
  });

  savePath(path, formData, "Operator berhasil ditambahkan.");
};

export const updateOperatorAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("operator", "edit");
  const path = "/master/operator";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit operator.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data operator tidak valid.", path);
  }

  let operator;
  try {
    operator = await prisma.operator.update({
      where: { id },
      data: {
        kode,
        nama,
        noKtp: nullableValue(formData, "noKtp"),
        telepon: nullableValue(formData, "telepon"),
        simType: nullableValue(formData, "simType"),
        simNo: nullableValue(formData, "simNo"),
        status: activeStatus(formData),
        unitId: nullableNumberValue(formData, "unitId"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "OPERATOR",
    entityId: operator.id,
    metadata: { kode: operator.kode, nama: operator.nama },
  });

  savePath(path, formData, "Operator berhasil diperbarui.");
};

export const deleteOperatorAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("operator", "delete");
  const path = "/master/operator";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus operator.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Operator tidak valid.", path);

  const operator = await prisma.operator.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          dailyReports: true,
          rentalContracts: true,
        },
      },
    },
  });

  if (!operator) return actionWarning(formData, "Operator tidak ditemukan.", path);
  if (operator._count.dailyReports > 0 || operator._count.rentalContracts > 0) {
    return actionWarning(formData, "Operator masih dipakai laporan harian atau kontrak, jadi belum bisa dihapus.", path);
  }

  await prisma.operator.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "OPERATOR",
    entityId: operator.id,
    metadata: { kode: operator.kode, nama: operator.nama },
  });

  savePath(path, formData, "Operator berhasil dihapus.");
};

export const createSparepartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("sparepart", "create");
  const path = "/master/sparepart";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat sparepart.", path);

  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!kode || !nama) {
    return actionError(formData, "Kode dan nama sparepart wajib diisi.", path);
  }

  let sparepart;
  try {
    sparepart = await prisma.sparepart.create({
      data: {
        kode,
        nama,
        satuan: nullableValue(formData, "satuan"),
        hargaSatuan: String(numberValue(formData, "hargaSatuan")),
        stok: String(numberValue(formData, "stok")),
        supplierId: nullableNumberValue(formData, "supplierId"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "SPAREPART",
    entityId: sparepart.id,
    metadata: { kode: sparepart.kode, nama: sparepart.nama },
  });

  savePath(path, formData, "Sparepart berhasil ditambahkan.");
};

export const updateSparepartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("sparepart", "edit");
  const path = "/master/sparepart";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit sparepart.", path);

  const id = toId(formData);
  const kode = upperValue(formData, "kode");
  const nama = value(formData, "nama");

  if (!id || !kode || !nama) {
    return actionError(formData, "Data sparepart tidak valid.", path);
  }

  let sparepart;
  try {
    sparepart = await prisma.sparepart.update({
      where: { id },
      data: {
        kode,
        nama,
        satuan: nullableValue(formData, "satuan"),
        hargaSatuan: String(numberValue(formData, "hargaSatuan")),
        stok: String(numberValue(formData, "stok")),
        supplierId: nullableNumberValue(formData, "supplierId"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "SPAREPART",
    entityId: sparepart.id,
    metadata: { kode: sparepart.kode, nama: sparepart.nama },
  });

  savePath(path, formData, "Sparepart berhasil diperbarui.");
};

export const deleteSparepartAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("sparepart", "delete");
  const path = "/master/sparepart";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus sparepart.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Sparepart tidak valid.", path);

  const sparepart = await prisma.sparepart.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      nama: true,
      _count: {
        select: {
          maintenanceParts: true,
        },
      },
    },
  });

  if (!sparepart) return actionWarning(formData, "Sparepart tidak ditemukan.", path);
  if (sparepart._count.maintenanceParts > 0) {
    return actionWarning(formData, "Sparepart masih dipakai maintenance, jadi belum bisa dihapus.", path);
  }

  await prisma.sparepart.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "SPAREPART",
    entityId: sparepart.id,
    metadata: { kode: sparepart.kode, nama: sparepart.nama },
  });

  savePath(path, formData, "Sparepart berhasil dihapus.");
};

export const createEquipmentUnitAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("master_unit", "create");
  const path = "/master/unit";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat unit.", path);

  const kodeLambung = upperValue(formData, "kodeLambung");
  const merk = value(formData, "merk");
  const model = value(formData, "model");

  if (!kodeLambung || !merk || !model) {
    return actionError(formData, "Kode lambung, merk, dan model wajib diisi.", path);
  }

  let unit;
  try {
    unit = await prisma.equipmentUnit.create({
      data: {
        kodeLambung,
        categoryId: nullableNumberValue(formData, "categoryId"),
        merk,
        model,
        tahun: nullableNumberValue(formData, "tahun"),
        noPolisi: nullableValue(formData, "noPolisi"),
        noChassis: nullableValue(formData, "noChassis"),
        noMesin: nullableValue(formData, "noMesin"),
        status: unitStatus(formData),
        locationId: nullableNumberValue(formData, "locationId"),
        tarifHarian: String(numberValue(formData, "tarifHarian")),
        tarifBulanan: String(numberValue(formData, "tarifBulanan")),
        currentHm: nullableNumberValue(formData, "currentHm") === null
          ? null
          : String(nullableNumberValue(formData, "currentHm")),
        catatan: nullableValue(formData, "catatan"),
        photoUrl: nullableValue(formData, "photoUrl"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "EQUIPMENT_UNIT",
    entityId: unit.id,
    metadata: { kodeLambung: unit.kodeLambung, merk: unit.merk, model: unit.model },
  });

  savePath(path, formData, "Unit alat berat berhasil ditambahkan.");
};

export const updateEquipmentUnitAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("master_unit", "edit");
  const path = "/master/unit";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit unit.", path);

  const id = toId(formData);
  const kodeLambung = upperValue(formData, "kodeLambung");
  const merk = value(formData, "merk");
  const model = value(formData, "model");
  const currentHm = nullableNumberValue(formData, "currentHm");

  if (!id || !kodeLambung || !merk || !model) {
    return actionError(formData, "Data unit alat berat tidak valid.", path);
  }

  let unit;
  try {
    unit = await prisma.equipmentUnit.update({
      where: { id },
      data: {
        kodeLambung,
        categoryId: nullableNumberValue(formData, "categoryId"),
        merk,
        model,
        tahun: nullableNumberValue(formData, "tahun"),
        noPolisi: nullableValue(formData, "noPolisi"),
        noChassis: nullableValue(formData, "noChassis"),
        noMesin: nullableValue(formData, "noMesin"),
        status: unitStatus(formData),
        locationId: nullableNumberValue(formData, "locationId"),
        tarifHarian: String(numberValue(formData, "tarifHarian")),
        tarifBulanan: String(numberValue(formData, "tarifBulanan")),
        currentHm: currentHm === null ? null : String(currentHm),
        catatan: nullableValue(formData, "catatan"),
        photoUrl: nullableValue(formData, "photoUrl"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "EQUIPMENT_UNIT",
    entityId: unit.id,
    metadata: { kodeLambung: unit.kodeLambung, merk: unit.merk, model: unit.model },
  });

  savePath(path, formData, "Unit alat berat berhasil diperbarui.");
};

export const deleteEquipmentUnitAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("master_unit", "delete");
  const path = "/master/unit";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus unit.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Unit alat berat tidak valid.", path);

  const unit = await prisma.equipmentUnit.findUnique({
    where: { id },
    select: {
      id: true,
      kodeLambung: true,
      merk: true,
      model: true,
      _count: {
        select: {
          dailyReports: true,
          fuelLogs: true,
          maintenanceOrders: true,
          mobilisasi: true,
          operators: true,
          quotations: true,
          rentalContracts: true,
          unitSaleHpps: true,
        },
      },
    },
  });

  if (!unit) return actionWarning(formData, "Unit alat berat tidak ditemukan.", path);

  const usedCount = Object.values(unit._count).reduce((total, count) => total + count, 0);
  if (usedCount > 0) {
    return actionWarning(formData, "Unit masih dipakai data transaksi atau master lain, jadi belum bisa dihapus.", path);
  }

  await prisma.equipmentUnit.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "EQUIPMENT_UNIT",
    entityId: unit.id,
    metadata: { kodeLambung: unit.kodeLambung, merk: unit.merk, model: unit.model },
  });

  savePath(path, formData, "Unit alat berat berhasil dihapus.");
};
