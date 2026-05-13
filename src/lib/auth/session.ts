import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth/types";

const SESSION_COOKIE = "sewa_alat_session";
const DEFAULT_MAX_AGE = 60 * 60 * 8;
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: number;
  expiresAt: number;
};

const getSessionSecret = () => {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;

  if (!secret) {
    throw new Error("AUTH_SECRET or DATABASE_URL must be set");
  }

  return secret;
};

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string) =>
  crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

const createToken = (payload: SessionPayload) => {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

const readToken = (token?: string): SessionPayload | null => {
  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature || signature !== sign(payload)) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload)) as SessionPayload;

    if (!session.userId || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

export const createAuthSession = async (userId: number, remember: boolean) => {
  const cookieStore = await cookies();
  const maxAge = remember ? REMEMBER_MAX_AGE : DEFAULT_MAX_AGE;
  const token = createToken({
    userId,
    expiresAt: Date.now() + maxAge * 1000,
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
};

export const clearAuthSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const session = readToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
      status: "Aktif",
    },
    select: {
      id: true,
      nama: true,
      username: true,
      email: true,
      userRoles: {
        take: 1,
        select: {
          role: {
            select: {
              kode: true,
              nama: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {
                      kode: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const role = user?.userRoles[0]?.role;

  if (!user || !role) {
    return null;
  }

  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    email: user.email ?? "",
    role: role.nama,
    roleCode: role.kode,
    permissions: role.rolePermissions.map((item) => item.permission.kode),
  };
};
