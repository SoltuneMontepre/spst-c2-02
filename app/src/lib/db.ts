import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter. Runtime uses the pooled Neon URL.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// node-postgres defaults to a max of 10 connections, which is easy to exhaust
// once bot decision loops, per-participant heartbeats, and SSE snapshot
// pushes all fire interactive transactions concurrently — starving requests
// hit P2028 "Unable to start a transaction in the given time".
const poolMax = Number(process.env.DATABASE_POOL_MAX ?? 20);

const createPrisma = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: poolMax }),
    // Default maxWait (2000ms) is too tight when the pool is briefly saturated
    // by concurrent bot batches/heartbeats — give queued transactions more
    // room to grab a connection before Prisma gives up with P2028.
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
