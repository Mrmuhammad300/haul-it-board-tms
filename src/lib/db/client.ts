import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse a single client across hot reloads in dev so we don't exhaust the
// Postgres connection pool with a new client per module reload.
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
