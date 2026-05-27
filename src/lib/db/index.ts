import { mkdirSync } from "node:fs";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

export type DB =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

const LOCAL_PGLITE_DIR = "./data/pglite";

function createDb(): DB {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl });
    return drizzlePg(pool, { schema });
  }
  mkdirSync(LOCAL_PGLITE_DIR, { recursive: true });
  const client = new PGlite(LOCAL_PGLITE_DIR);
  return drizzlePglite(client, { schema });
}

const globalForDb = globalThis as unknown as { __db?: DB };

export const db: DB = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

