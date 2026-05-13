import "server-only";

import { redirect } from "next/navigation";

export type ActionNoticeType = "success" | "error" | "warning" | "info";

const sanitizePath = (path: string | null | undefined, fallback: string) => {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
};

export const getReturnTo = (formData: FormData, fallback = "/") =>
  sanitizePath(String(formData.get("returnTo") ?? ""), fallback);

export const withActionNotice = (
  path: string,
  type: ActionNoticeType,
  message: string
) => {
  const [pathAndQuery, hash = ""] = path.split("#");
  const [pathname, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);

  params.set("notice", type);
  params.set("noticeMessage", message);

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
};

export const redirectWithNotice = (
  path: string,
  type: ActionNoticeType,
  message: string
): never => redirect(withActionNotice(path, type, message));

export const actionSuccess = (
  formData: FormData,
  message: string,
  fallback = "/"
): never => redirectWithNotice(getReturnTo(formData, fallback), "success", message);

export const actionError = (
  formData: FormData,
  message: string,
  fallback = "/"
): never => redirectWithNotice(getReturnTo(formData, fallback), "error", message);

export const actionWarning = (
  formData: FormData,
  message: string,
  fallback = "/"
): never => redirectWithNotice(getReturnTo(formData, fallback), "warning", message);
