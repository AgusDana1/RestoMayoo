import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  let poolConfig: mariadb.PoolConfig;

  try {
    const parsed = new URL(dbUrl);
    poolConfig = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      connectTimeout: 30000,
      acquireTimeout: 30000,
      connectionLimit: 10,
    };
  } catch {
    poolConfig = {
      connectTimeout: 30000,
      acquireTimeout: 30000,
      connectionLimit: 10,
    };
  }

  const pool = mariadb.createPool(poolConfig);
  const adapter = new PrismaMariaDb(pool);

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

