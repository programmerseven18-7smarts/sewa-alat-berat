import "server-only";

import { notFound, redirect } from "next/navigation";
import { makePermissionCode, type PermissionAction } from "@/lib/access-control";
import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export const canUserAccess = (
  user: AuthUser | null,
  resourceKey: string,
  action: PermissionAction
) => {
  if (!user) return false;
  if (user.roleCode === "SUPER_ADMIN") return true;

  return user.permissions.includes(makePermissionCode(resourceKey, action));
};

export const getAuthorizedUser = async (
  resourceKey: string,
  action: PermissionAction
) => {
  const user = await getCurrentUser();
  return canUserAccess(user, resourceKey, action) ? user : null;
};

export const requirePageAccess = async (
  resourceKey: string,
  action: PermissionAction = "view"
) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  if (!canUserAccess(user, resourceKey, action)) {
    notFound();
  }

  return user;
};
