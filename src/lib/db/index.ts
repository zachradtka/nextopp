import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

function createDb(): DB {
  // `pg.Pool` is lazy — it doesn't open a connection until the first query.
  // That lets `next build`'s page-data-collection import this module without
  // a live DB. If DATABASE_URL is actually missing at query time, the Pool
  // will surface a clear ECONNREFUSED.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool, { schema });
}

const globalForDb = globalThis as unknown as { __db?: DB };

export const db: DB = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}
