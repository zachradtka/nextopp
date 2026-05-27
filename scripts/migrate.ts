/**
 * Apply pending Drizzle migrations from ./drizzle against the Postgres at
 * DATABASE_URL. Used in three contexts:
 *
 *   - Local dev: DATABASE_URL points at the Docker Postgres in
 *     docker-compose.yml (the `dev` npm script runs this before next dev).
 *   - Vercel build: DATABASE_URL points at the Neon branch for this deploy.
 *   - Manual prod runs: when adding a one-off migration.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is not set. For local dev, run `docker compose up -d` first."
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
