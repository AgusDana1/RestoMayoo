import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  let poolConfig: any;

  try {
    const parsed = new URL(dbUrl);
    const useSsl =
      parsed.searchParams.get("ssl-mode")?.toUpperCase() === "REQUIRED" ||
      parsed.searchParams.get("ssl") === "true" ||
      dbUrl.toLowerCase().includes("ssl-mode=required") ||
      dbUrl.toLowerCase().includes("ssl=true");

    poolConfig = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      connectTimeout: 30000,
      acquireTimeout: 30000,
      connectionLimit: 10,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  } catch {
    poolConfig = {
      connectTimeout: 30000,
      acquireTimeout: 30000,
      connectionLimit: 10,
    };
  }

  const pool = mariadb.createPool(poolConfig);
  const adapter = new PrismaMariaDb(pool as any);

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

