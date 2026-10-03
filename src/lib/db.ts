import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// WAL: persistent per-file; cukup sekali saat aplikasi start
void prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
