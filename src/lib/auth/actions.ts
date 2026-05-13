"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAuthSession, clearAuthSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";

export type SignInState = {
  error?: string;
  email?: string;
};

export const signInAction = async (
  _previousState: SignInState,
  formData: FormData
): Promise<SignInState> => {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return {
      error: "Email dan password wajib diisi.",
      email,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      userRoles: {
        take: 1,
        select: {
          role: {
            select: {
              kode: true,
            },
          },
        },
      },
    },
  });

  const validPassword =
    user?.passwordHash && (await verifyPassword(password, user.passwordHash));
  const hasRole = Boolean(user?.userRoles[0]?.role);

  if (!user || !validPassword || user.status !== "Aktif" || !hasRole) {
    return {
      error: "Email atau password salah.",
      email,
    };
  }

  await writeAuditLog({
    userId: user.id,
    action: "SIGN_IN",
    entityType: "USER",
    entityId: user.id,
    metadata: {
      role: user.userRoles[0]?.role.kode,
    },
  });

  await createAuthSession(user.id, remember);
  redirect("/");
};

export const signOutAction = async () => {
  await clearAuthSession();
  redirect("/signin");
};
