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

const invoiceStatus = (formData: FormData) => {
  const raw = value(formData, "status");
  if (raw === "Lunas" || raw === "Sebagian" || raw === "Jatuh Tempo") return raw;
  return "Belum Lunas";
};

const paymentMethod = (formData: FormData) => {
  const raw = value(formData, "metode");
  if (raw === "Tunai" || raw === "Giro" || raw === "Cek") return raw;
  return "Transfer";
};

const booleanValue = (formData: FormData, key: string) => value(formData, key) === "true";

const toId = (formData: FormData) => Number(value(formData, "id"));

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const warnPrismaError = (formData: FormData, error: unknown, path: string) => {
  if (isUniqueError(error)) {
    return actionWarning(formData, "Nomor dokumen sudah dipakai data lain.", path);
  }

  console.error(error);
  return actionError(formData, "Data gagal disimpan. Cek kembali isian form.", path);
};

const savePath = (path: string, formData: FormData, message: string) => {
  revalidatePath(path);
  actionSuccess(formData, message, path);
};

const recalcInvoiceStatus = async (invoiceId: number, tx: Prisma.TransactionClient = prisma) => {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      total: true,
      payments: {
        select: {
          jumlah: true,
        },
      },
    },
  });

  if (!invoice) return;

  const total = Number(invoice.total);
  const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.jumlah), 0);
  const status = paid >= total && total > 0 ? "Lunas" : paid > 0 ? "Sebagian" : "Belum Lunas";

  await tx.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });
};

export const createInvoiceAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("invoice", "create");
  const path = "/keuangan/invoice";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat invoice.", path);

  const noInvoice = value(formData, "noInvoice").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");
  const subtotal = numberValue(formData, "subtotal");
  const pajak = numberValue(formData, "pajak");
  const total = numberValue(formData, "total") || subtotal + pajak;

  if (!noInvoice || !customerId || !tanggal) {
    return actionError(formData, "No. invoice, customer, dan tanggal wajib diisi.", path);
  }
  if (subtotal < 0 || pajak < 0 || total < 0) {
    return actionError(formData, "Nominal invoice tidak boleh minus.", path);
  }

  let invoice;
  try {
    invoice = await prisma.invoice.create({
      data: {
        noInvoice,
        contractId: nullableNumberValue(formData, "contractId"),
        customerId,
        tanggal,
        jatuhTempo: dateValue(formData, "jatuhTempo"),
        tipe: value(formData, "tipe") || "Sewa",
        subtotal: String(subtotal),
        pajak: String(pajak),
        total: String(total),
        status: invoiceStatus(formData),
        bankAccountId: nullableNumberValue(formData, "bankAccountId"),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "INVOICE",
    entityId: invoice.id,
    metadata: { noInvoice: invoice.noInvoice, total },
  });

  savePath(path, formData, "Invoice berhasil dibuat.");
};

export const updateInvoiceAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("invoice", "edit");
  const path = "/keuangan/invoice";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit invoice.", path);

  const id = toId(formData);
  const noInvoice = value(formData, "noInvoice").toUpperCase();
  const customerId = nullableNumberValue(formData, "customerId");
  const tanggal = dateValue(formData, "tanggal");
  const subtotal = numberValue(formData, "subtotal");
  const pajak = numberValue(formData, "pajak");
  const total = numberValue(formData, "total") || subtotal + pajak;

  if (!id || !noInvoice || !customerId || !tanggal) {
    return actionError(formData, "Data invoice tidak valid.", path);
  }
  if (subtotal < 0 || pajak < 0 || total < 0) {
    return actionError(formData, "Nominal invoice tidak boleh minus.", path);
  }

  let invoice;
  try {
    invoice = await prisma.invoice.update({
      where: { id },
      data: {
        noInvoice,
        contractId: nullableNumberValue(formData, "contractId"),
        customerId,
        tanggal,
        jatuhTempo: dateValue(formData, "jatuhTempo"),
        tipe: value(formData, "tipe") || "Sewa",
        subtotal: String(subtotal),
        pajak: String(pajak),
        total: String(total),
        status: invoiceStatus(formData),
        bankAccountId: nullableNumberValue(formData, "bankAccountId"),
        catatan: nullableValue(formData, "catatan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await recalcInvoiceStatus(id);
  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "INVOICE",
    entityId: invoice.id,
    metadata: { noInvoice: invoice.noInvoice, total },
  });

  savePath(path, formData, "Invoice berhasil diperbarui.");
};

export const deleteInvoiceAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("invoice", "delete");
  const path = "/keuangan/invoice";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus invoice.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Invoice tidak valid.", path);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      noInvoice: true,
      _count: {
        select: {
          payments: true,
          receipts: true,
        },
      },
    },
  });

  if (!invoice) return actionWarning(formData, "Invoice tidak ditemukan.", path);
  if (invoice._count.payments > 0 || invoice._count.receipts > 0) {
    return actionWarning(formData, "Invoice sudah dipakai pembayaran atau kwitansi, jadi belum bisa dihapus.", path);
  }

  await prisma.invoice.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "INVOICE",
    entityId: invoice.id,
    metadata: { noInvoice: invoice.noInvoice },
  });

  savePath(path, formData, "Invoice berhasil dihapus.");
};

export const createPaymentAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("pembayaran", "create");
  const path = "/keuangan/pembayaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses input pembayaran.", path);

  const noPembayaran = value(formData, "noPembayaran").toUpperCase();
  const invoiceId = nullableNumberValue(formData, "invoiceId");
  const tanggal = dateValue(formData, "tanggal");
  const jumlah = numberValue(formData, "jumlah");

  if (!noPembayaran || !invoiceId || !tanggal) {
    return actionError(formData, "No. pembayaran, invoice, dan tanggal wajib diisi.", path);
  }
  if (jumlah <= 0) return actionError(formData, "Jumlah pembayaran harus lebih dari 0.", path);

  let payment;
  try {
    payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          noPembayaran,
          invoiceId,
          tanggal,
          jumlah: String(jumlah),
          metode: paymentMethod(formData),
          bankAccountId: nullableNumberValue(formData, "bankAccountId"),
          catatan: nullableValue(formData, "catatan"),
        },
      });

      await recalcInvoiceStatus(invoiceId, tx);
      return created;
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "PAYMENT",
    entityId: payment.id,
    metadata: { noPembayaran: payment.noPembayaran, jumlah },
  });

  revalidatePath("/keuangan/invoice");
  savePath(path, formData, "Pembayaran berhasil disimpan.");
};

export const updatePaymentAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("pembayaran", "edit");
  const path = "/keuangan/pembayaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit pembayaran.", path);

  const id = toId(formData);
  const noPembayaran = value(formData, "noPembayaran").toUpperCase();
  const invoiceId = nullableNumberValue(formData, "invoiceId");
  const tanggal = dateValue(formData, "tanggal");
  const jumlah = numberValue(formData, "jumlah");

  if (!id || !noPembayaran || !invoiceId || !tanggal) {
    return actionError(formData, "Data pembayaran tidak valid.", path);
  }
  if (jumlah <= 0) return actionError(formData, "Jumlah pembayaran harus lebih dari 0.", path);

  let payment;
  try {
    payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { id },
        select: { invoiceId: true },
      });

      const updated = await tx.payment.update({
        where: { id },
        data: {
          noPembayaran,
          invoiceId,
          tanggal,
          jumlah: String(jumlah),
          metode: paymentMethod(formData),
          bankAccountId: nullableNumberValue(formData, "bankAccountId"),
          catatan: nullableValue(formData, "catatan"),
        },
      });

      if (existing?.invoiceId && existing.invoiceId !== invoiceId) {
        await recalcInvoiceStatus(existing.invoiceId, tx);
      }
      await recalcInvoiceStatus(invoiceId, tx);

      return updated;
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "PAYMENT",
    entityId: payment.id,
    metadata: { noPembayaran: payment.noPembayaran, jumlah },
  });

  revalidatePath("/keuangan/invoice");
  savePath(path, formData, "Pembayaran berhasil diperbarui.");
};

export const deletePaymentAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("pembayaran", "delete");
  const path = "/keuangan/pembayaran";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus pembayaran.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Pembayaran tidak valid.", path);

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      noPembayaran: true,
      invoiceId: true,
    },
  });

  if (!payment) return actionWarning(formData, "Pembayaran tidak ditemukan.", path);

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id } });
    await recalcInvoiceStatus(payment.invoiceId, tx);
  });

  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "PAYMENT",
    entityId: payment.id,
    metadata: { noPembayaran: payment.noPembayaran },
  });

  revalidatePath("/keuangan/invoice");
  savePath(path, formData, "Pembayaran berhasil dihapus.");
};

export const createReceiptAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kwitansi", "create");
  const path = "/keuangan/kwitansi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses membuat kwitansi.", path);

  const noKwitansi = value(formData, "noKwitansi").toUpperCase();
  const tanggal = dateValue(formData, "tanggal");
  const diterimaDari = value(formData, "diterimaDari");
  const untukPembayaran = value(formData, "untukPembayaran");
  const jumlah = numberValue(formData, "jumlah");

  if (!noKwitansi || !tanggal || !diterimaDari || !untukPembayaran) {
    return actionError(formData, "No. kwitansi, tanggal, diterima dari, dan untuk pembayaran wajib diisi.", path);
  }
  if (jumlah <= 0) return actionError(formData, "Jumlah kwitansi harus lebih dari 0.", path);

  let receipt;
  try {
    receipt = await prisma.receipt.create({
      data: {
        noKwitansi,
        invoiceId: nullableNumberValue(formData, "invoiceId"),
        tanggal,
        diterimaDari,
        untukPembayaran,
        jumlah: String(jumlah),
        terbilang: nullableValue(formData, "terbilang"),
        bankAccountId: nullableNumberValue(formData, "bankAccountId"),
        penandatangan: nullableValue(formData, "penandatangan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "RECEIPT",
    entityId: receipt.id,
    metadata: { noKwitansi: receipt.noKwitansi, jumlah },
  });

  savePath(path, formData, "Kwitansi berhasil dibuat.");
};

export const updateReceiptAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kwitansi", "edit");
  const path = "/keuangan/kwitansi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit kwitansi.", path);

  const id = toId(formData);
  const noKwitansi = value(formData, "noKwitansi").toUpperCase();
  const tanggal = dateValue(formData, "tanggal");
  const diterimaDari = value(formData, "diterimaDari");
  const untukPembayaran = value(formData, "untukPembayaran");
  const jumlah = numberValue(formData, "jumlah");

  if (!id || !noKwitansi || !tanggal || !diterimaDari || !untukPembayaran) {
    return actionError(formData, "Data kwitansi tidak valid.", path);
  }
  if (jumlah <= 0) return actionError(formData, "Jumlah kwitansi harus lebih dari 0.", path);

  let receipt;
  try {
    receipt = await prisma.receipt.update({
      where: { id },
      data: {
        noKwitansi,
        invoiceId: nullableNumberValue(formData, "invoiceId"),
        tanggal,
        diterimaDari,
        untukPembayaran,
        jumlah: String(jumlah),
        terbilang: nullableValue(formData, "terbilang"),
        bankAccountId: nullableNumberValue(formData, "bankAccountId"),
        penandatangan: nullableValue(formData, "penandatangan"),
      },
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "RECEIPT",
    entityId: receipt.id,
    metadata: { noKwitansi: receipt.noKwitansi, jumlah },
  });

  savePath(path, formData, "Kwitansi berhasil diperbarui.");
};

export const deleteReceiptAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kwitansi", "delete");
  const path = "/keuangan/kwitansi";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus kwitansi.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Kwitansi tidak valid.", path);

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    select: {
      id: true,
      noKwitansi: true,
    },
  });

  if (!receipt) return actionWarning(formData, "Kwitansi tidak ditemukan.", path);

  await prisma.receipt.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "RECEIPT",
    entityId: receipt.id,
    metadata: { noKwitansi: receipt.noKwitansi },
  });

  savePath(path, formData, "Kwitansi berhasil dihapus.");
};

export const createBankAccountAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kas_bank", "create");
  const path = "/keuangan/kas-bank";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses menambah rekening.", path);

  const namaBank = value(formData, "namaBank").toUpperCase();
  const noRekening = value(formData, "noRekening");
  const atasNama = value(formData, "atasNama").toUpperCase();
  const isDefault = booleanValue(formData, "isDefault");

  if (!namaBank || !noRekening || !atasNama) {
    return actionError(formData, "Nama bank, no. rekening, dan atas nama wajib diisi.", path);
  }

  let bankAccount;
  try {
    bankAccount = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.bankAccount.updateMany({ data: { isDefault: false } });
      }

      return tx.bankAccount.create({
        data: {
          namaBank,
          cabang: nullableValue(formData, "cabang"),
          noRekening,
          atasNama,
          isDefault,
        },
      });
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "CREATE",
    entityType: "BANK_ACCOUNT",
    entityId: bankAccount.id,
    metadata: { namaBank: bankAccount.namaBank, noRekening: bankAccount.noRekening },
  });

  revalidatePath("/keuangan/invoice");
  revalidatePath("/keuangan/pembayaran");
  revalidatePath("/keuangan/kwitansi");
  savePath(path, formData, "Rekening berhasil ditambahkan.");
};

export const updateBankAccountAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kas_bank", "edit");
  const path = "/keuangan/kas-bank";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses edit rekening.", path);

  const id = toId(formData);
  const namaBank = value(formData, "namaBank").toUpperCase();
  const noRekening = value(formData, "noRekening");
  const atasNama = value(formData, "atasNama").toUpperCase();
  const isDefault = booleanValue(formData, "isDefault");

  if (!id || !namaBank || !noRekening || !atasNama) {
    return actionError(formData, "Data rekening tidak valid.", path);
  }

  let bankAccount;
  try {
    bankAccount = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.bankAccount.updateMany({
          where: { id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.bankAccount.update({
        where: { id },
        data: {
          namaBank,
          cabang: nullableValue(formData, "cabang"),
          noRekening,
          atasNama,
          isDefault,
        },
      });
    });
  } catch (error) {
    return warnPrismaError(formData, error, path);
  }

  await writeAuditLog({
    userId: currentUser.id,
    action: "UPDATE",
    entityType: "BANK_ACCOUNT",
    entityId: bankAccount.id,
    metadata: { namaBank: bankAccount.namaBank, noRekening: bankAccount.noRekening },
  });

  revalidatePath("/keuangan/invoice");
  revalidatePath("/keuangan/pembayaran");
  revalidatePath("/keuangan/kwitansi");
  savePath(path, formData, "Rekening berhasil diperbarui.");
};

export const deleteBankAccountAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("kas_bank", "delete");
  const path = "/keuangan/kas-bank";

  if (!currentUser) return actionError(formData, "Anda tidak punya akses hapus rekening.", path);

  const id = toId(formData);
  if (!id) return actionError(formData, "Rekening tidak valid.", path);

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
    select: {
      id: true,
      namaBank: true,
      noRekening: true,
      _count: {
        select: {
          invoices: true,
          payments: true,
          receipts: true,
        },
      },
    },
  });

  if (!bankAccount) return actionWarning(formData, "Rekening tidak ditemukan.", path);
  if (
    bankAccount._count.invoices > 0 ||
    bankAccount._count.payments > 0 ||
    bankAccount._count.receipts > 0
  ) {
    return actionWarning(formData, "Rekening sudah dipakai transaksi keuangan, jadi belum bisa dihapus.", path);
  }

  await prisma.bankAccount.delete({ where: { id } });
  await writeAuditLog({
    userId: currentUser.id,
    action: "DELETE",
    entityType: "BANK_ACCOUNT",
    entityId: bankAccount.id,
    metadata: { namaBank: bankAccount.namaBank, noRekening: bankAccount.noRekening },
  });

  revalidatePath("/keuangan/invoice");
  revalidatePath("/keuangan/pembayaran");
  revalidatePath("/keuangan/kwitansi");
  savePath(path, formData, "Rekening berhasil dihapus.");
};
