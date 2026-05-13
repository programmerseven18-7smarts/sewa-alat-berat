"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  actionWarning,
} from "@/lib/action-feedback";
import {
  allPermissionCodes,
  defaultRolePermissionCodesByCode,
  type DefaultRoleCode,
} from "@/lib/access-control";
import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const rolePath = "/settings/roles";

const getValue = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const isDefaultRoleCode = (value: string): value is DefaultRoleCode =>
  value === "SUPER_ADMIN" ||
  value === "ADMIN" ||
  value === "FINANCE" ||
  value === "OPERASIONAL";

export const updateRolePermissionsAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("role_permission", "edit");
  const roleId = Number(getValue(formData, "roleId"));

  if (!currentUser) {
    return actionError(formData, "Anda tidak punya akses mengubah hak akses.", rolePath);
  }

  if (!roleId) {
    return actionError(formData, "Role belum dipilih.", rolePath);
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      kode: true,
      nama: true,
    },
  });

  if (!role) {
    return actionWarning(formData, "Role tidak ditemukan.", rolePath);
  }

  const submittedCodes = formData.getAll("permissionCodes").map(String);
  const permissionCodes =
    role.kode === "SUPER_ADMIN"
      ? defaultRolePermissionCodesByCode.SUPER_ADMIN
      : submittedCodes.filter((code) => allPermissionCodes.includes(code));

  const permissions = await prisma.permission.findMany({
    where: {
      kode: {
        in: permissionCodes,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    if (permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }

    await writeAuditLog(
      {
        userId: currentUser.id,
        action: "UPDATE_PERMISSION",
        entityType: "ROLE",
        entityId: roleId,
        metadata: {
          roleCode: role.kode,
          roleName: role.nama,
          permissionCount: permissions.length,
        },
      },
      tx
    );
  });

  revalidatePath(rolePath);
  actionSuccess(formData, "Hak akses role berhasil disimpan.", rolePath);
};

export const resetDefaultRolePermissionsAction = async (formData: FormData) => {
  const currentUser = await getAuthorizedUser("role_permission", "edit");
  const roleId = Number(getValue(formData, "roleId"));

  if (!currentUser) {
    return actionError(formData, "Anda tidak punya akses reset hak akses.", rolePath);
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      kode: true,
      nama: true,
    },
  });

  if (!role || !isDefaultRoleCode(role.kode)) {
    return actionWarning(formData, "Role bawaan tidak ditemukan.", rolePath);
  }

  const permissionCodes = defaultRolePermissionCodesByCode[role.kode];
  const permissions = await prisma.permission.findMany({
    where: {
      kode: {
        in: permissionCodes,
      },
    },
    select: {
      id: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await writeAuditLog(
      {
        userId: currentUser.id,
        action: "RESET_PERMISSION",
        entityType: "ROLE",
        entityId: roleId,
        metadata: {
          roleCode: role.kode,
          permissionCount: permissions.length,
        },
      },
      tx
    );
  });

  revalidatePath(rolePath);
  actionSuccess(formData, "Hak akses role dikembalikan ke default.", rolePath);
};
