/**
 * Apply pending Drizzle migrations from ./drizzle.
 *
 * Routing:
 *   - DATABASE_URL set → node-postgres against that URL (Neon in prod/preview)
 *   - DATABASE_URL unset → file-backed PGlite at ./data/pglite (local dev)
 */

import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const LOCAL_PGLITE_DIR = "./data/pglite";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const migrationsFolder = "./drizzle";

  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzlePg(pool);
    await migratePg(db, { migrationsFolder });
    await pool.end();
    console.log("Migrations applied to Postgres at DATABASE_URL.");
  } else {
    mkdirSync(LOCAL_PGLITE_DIR, { recursive: true });
    const client = new PGlite(LOCAL_PGLITE_DIR);
    const db = drizzlePglite(client);
    await migratePglite(db, { migrationsFolder });
    await client.close();
    console.log(`Migrations applied to local PGlite at ${LOCAL_PGLITE_DIR}.`);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
