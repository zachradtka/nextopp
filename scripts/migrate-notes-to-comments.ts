/**
 * Migration script: opportunities.notes -> opportunity_comments
 *
 * For every opportunity with a non-empty `notes` value, inserts one row into
 * `opportunity_comments` with `body = notes` and `created_at = opportunity.created_at`,
 * so the migrated note appears at the start of the timeline.
 *
 * Safe to re-run: skips opportunities that already have a migrated comment with
 * the same body + createdAt.
 *
 * Prerequisites:
 *   - `opportunity_comments` table exists (run `npm run db:push` first)
 *   - The `notes` column is still present on `opportunities` (don't drop it until after)
 *
 * Usage:
 *   # Local SQLite (default)
 *   npx tsx scripts/migrate-notes-to-comments.ts
 *
 *   # Turso
 *   TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npx tsx scripts/migrate-notes-to-comments.ts
 *
 *   # Dry run (report what would happen, no writes)
 *   npx tsx scripts/migrate-notes-to-comments.ts --dry-run
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { opportunities, opportunityComments } from "../src/lib/db/schema";

const isDryRun = process.argv.includes("--dry-run");

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    return drizzle(createClient({ url, authToken }));
  }

  return drizzle(createClient({ url: "file:local.db" }));
}

async function main() {
  const db = createDb();
  const target = process.env.TURSO_DATABASE_URL ? "Turso" : "local.db";
  console.log(`Migrating notes → opportunity_comments on ${target}${isDryRun ? " (dry run)" : ""}`);

  const rows = await db
    .select({
      id: opportunities.id,
      notes: sql<string | null>`notes`,
      createdAt: opportunities.createdAt,
    })
    .from(opportunities);

  let migrated = 0;
  let skippedEmpty = 0;
  let skippedExisting = 0;

  for (const row of rows) {
    const body = row.notes?.trim();
    if (!body) {
      skippedEmpty++;
      continue;
    }

    const existing = await db
      .select({ id: opportunityComments.id })
      .from(opportunityComments)
      .where(
        and(
          eq(opportunityComments.opportunityId, row.id),
          eq(opportunityComments.body, body),
          eq(opportunityComments.createdAt, row.createdAt)
        )
      )
      .limit(1);

    if (existing[0]) {
      skippedExisting++;
      continue;
    }

    if (!isDryRun) {
      await db.insert(opportunityComments).values({
        id: nanoid(),
        opportunityId: row.id,
        body,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
      });
    }
    migrated++;
  }

  console.log(`Scanned: ${rows.length} opportunities`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (empty notes): ${skippedEmpty}`);
  console.log(`Skipped (already migrated): ${skippedExisting}`);

  if (isDryRun) {
    console.log("Dry run — no writes performed. Re-run without --dry-run to apply.");
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
