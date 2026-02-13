import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaSingleton: PrismaClient | undefined;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

function createClient() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL)");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getClient() {
  if (process.env.NODE_ENV !== "production" && global.prisma) {
    return global.prisma;
  }
  if (!prismaSingleton) {
    prismaSingleton = createClient();
    if (process.env.NODE_ENV !== "production") {
      global.prisma = prismaSingleton;
    }
  }
  return prismaSingleton;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
