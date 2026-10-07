import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// ponytail: SQLite WAL + busy_timeout biar tidak SQLITE_BUSY saat Cloudflare Tunnel burst (banyak request paralel).
// Tanpa busy_timeout tunnel ngadat: findMany(image/services) + jwt(session) rebutan lock → 5s retry vs langsung busy.
void (async () => {
  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
    await prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000;");
    await prisma.$executeRawUnsafe("PRAGMA synchronous=NORMAL;");
  } catch {}
})();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
