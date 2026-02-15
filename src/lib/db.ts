import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith("file:")) {
    // No valid PostgreSQL URL configured — skip DB
    return null;
  }
  try {
    return new PrismaClient();
  } catch {
    console.warn("Failed to initialize Prisma client — DB features disabled");
    return null;
  }
}

const realClient = globalForPrisma.prisma ?? createPrismaClient();
if (realClient && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = realClient;
}

/**
 * A proxy that forwards to the real PrismaClient when available,
 * or returns safe no-op results when the DB is not configured.
 * This lets the app run without a database (search, compare, etc. still work).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createNoOpProxy(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      // Prisma methods like $connect, $disconnect
      if (typeof prop === "string" && prop.startsWith("$")) {
        return () => Promise.resolve();
      }
      // Model access (e.g. prisma.product) returns another proxy
      // whose methods (findMany, create, etc.) return safe defaults
      return new Proxy(
        {},
        {
          get(_t, method) {
            return (..._args: unknown[]) => {
              if (method === "findMany") return Promise.resolve([]);
              if (method === "findUnique" || method === "findFirst")
                return Promise.resolve(null);
              if (method === "count") return Promise.resolve(0);
              if (method === "create" || method === "update" || method === "upsert")
                return Promise.resolve({});
              if (method === "delete" || method === "deleteMany")
                return Promise.resolve({});
              return Promise.resolve(null);
            };
          },
        }
      );
    },
  };
  return new Proxy({}, handler);
}

export const prisma: PrismaClient = realClient ?? createNoOpProxy();
