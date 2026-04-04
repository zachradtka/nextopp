/**
 * Migration script: single-user -> multi-user schema
 *
 * This script:
 * 1. Creates the users and status_history tables (via db:push)
 * 2. Creates a user record for the given userId
 * 3. Backfills userId on all existing opportunities
 * 4. Splits the combined location field into workMode + location
 * 5. Creates initial status_history entries for existing opportunities
 *
 * Prerequisites:
 *   - Run `npm run db:push` FIRST to apply the schema changes
 *     (this adds the new tables and columns)
 *   - Then run this script to migrate existing data
 *
 * Usage:
 *   npx tsx scripts/migrate-multi-user.ts <user-id> <user-email>
 *
 * Example:
 *   # For Turso (set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars)
 *   npx tsx scripts/migrate-multi-user.ts abc123 zach@example.com
 *
 *   # For local SQLite
 *   npx tsx scripts/migrate-multi-user.ts local-dev-user local@localhost
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { opportunities, users, statusHistory } from "../src/lib/db/schema";

const WORK_MODE_KEYWORDS: Record<string, string> = {
  remote: "remote",
  hybrid: "hybrid",
  onsite: "onsite",
  "on-site": "onsite",
  "in-office": "onsite",
};

function splitLocation(combined: string | null): {
  workMode: string | null;
  location: string | null;
} {
  if (!combined) return { workMode: null, location: null };

  const lower = combined.toLowerCase().trim();

  // Check if the location starts with a known work mode keyword
  for (const [keyword, mode] of Object.entries(WORK_MODE_KEYWORDS)) {
    if (lower.startsWith(keyword)) {
      // Extract the remaining location after the keyword and separator
      let remaining = combined.slice(keyword.length).trim();
      // Remove common separators like " - ", " · ", ", "
      remaining = remaining.replace(/^[\s\-·,]+/, "").trim();
      return {
        workMode: mode,
        location: remaining || null,
      };
    }
  }

  // No work mode detected — keep entire string as location
  return { workMode: null, location: combined };
}

async function main() {
  const userId = process.argv[2];
  const userEmail = process.argv[3];

  if (!userId || !userEmail) {
    console.error(
      "Usage: npx tsx scripts/migrate-multi-user.ts <user-id> <user-email>"
    );
    console.error(
      "\nYou can find your NextAuth user ID by signing in with GitHub"
    );
    console.error(
      "and checking the session, or use any stable identifier."
    );
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const client = createClient(
    url ? { url, authToken } : { url: "file:local.db" }
  );
  const db = drizzle(client);

  console.log(`Migrating to multi-user schema...`);
  console.log(`Target database: ${url ?? "file:local.db"}`);
  console.log(`User ID: ${userId}`);
  console.log(`User email: ${userEmail}\n`);

  // Step 1: Create user record
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    const now = new Date().toISOString();
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created user: ${userId}`);
  } else {
    console.log(`User already exists: ${userId}`);
  }

  // Step 2: Backfill userId on opportunities that don't have one
  // Since db:push adds the column as nullable first, we update existing rows
  const allOpps = await db.select().from(opportunities);
  let backfilled = 0;
  let locationsSplit = 0;

  for (const opp of allOpps) {
    const updates: Record<string, unknown> = {};

    // Backfill userId if missing
    if (!opp.userId) {
      updates.userId = userId;
      backfilled++;
    }

    // Split combined location into workMode + location
    if (opp.location && !opp.workMode) {
      const { workMode, location } = splitLocation(opp.location);
      if (workMode) {
        updates.workMode = workMode;
        updates.location = location;
        locationsSplit++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(opportunities)
        .set(updates)
        .where(eq(opportunities.id, opp.id));
    }
  }

  console.log(`Backfilled userId on ${backfilled} opportunities`);
  console.log(`Split location into workMode + location on ${locationsSplit} opportunities`);

  // Step 3: Create initial status_history for opportunities that don't have any
  const oppsWithoutHistory = await db
    .select({
      id: opportunities.id,
      status: opportunities.status,
      createdAt: opportunities.createdAt,
    })
    .from(opportunities);

  let historiesCreated = 0;

  for (const opp of oppsWithoutHistory) {
    const existingHistory = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.opportunityId, opp.id))
      .limit(1);

    if (existingHistory.length === 0) {
      await db.insert(statusHistory).values({
        id: nanoid(),
        opportunityId: opp.id,
        status: opp.status,
        changedAt: opp.createdAt,
        note: "Initial status (migrated)",
      });
      historiesCreated++;
    }
  }

  console.log(`Created ${historiesCreated} initial status history entries`);
  console.log(`\nMigration complete!`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
