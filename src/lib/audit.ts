import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditClient = typeof prisma | Prisma.TransactionClient;

type AuditLogInput = {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  metadata?: Prisma.InputJsonValue;
};

export const writeAuditLog = async (
  input: AuditLogInput,
  client: AuditClient = prisma
) => {
  await client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
};
