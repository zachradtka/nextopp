/**
 * One-shot data migration: Turso (libSQL) → Neon (Postgres).
 *
 * This script does NOT run automatically. Production cutover is tracked in
 * issue #100; this is the data-copying tool that runbook invokes.
 *
 * Reads:
 *   - TURSO_DATABASE_URL, TURSO_AUTH_TOKEN  → source
 *   - DATABASE_URL                          → target
 *
 * Behavior:
 *   - Idempotent: TRUNCATEs target tables in FK-safe order, then inserts.
 *     Re-running produces the same target state.
 *   - --dry-run: prints source row counts, validates target schema, exits.
 *   - --limit N: copies only the most recent N opportunities (plus
 *     dependent status_history / opportunity_comments rows).
 *
 * Source schema is the pre-migration SQLite shape. Transforms live in
 * scripts/lib/migrate-transform.ts and are unit-tested.
 */

import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import {
  users,
  accounts,
  verificationTokens,
  opportunities,
  statusHistory,
  opportunityComments,
} from "../src/lib/db/schema";
import {
  transformAccount,
  transformComment,
  transformOpportunity,
  transformStatusHistory,
  transformUser,
  transformVerificationToken,
} from "./lib/migrate-transform";

// Reverse-FK order for TRUNCATE so dependents go before referenced tables.
const TABLES_TRUNCATE_ORDER = [
  "opportunity_comments",
  "status_history",
  "opportunities",
  "accounts",
  "verification_tokens",
  "users",
];

type Options = {
  dryRun: boolean;
  limit: number | null;
};

function parseArgs(argv: string[]): Options {
  const opts: Options = { dryRun: false, limit: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`--limit requires a positive integer, got ${argv[i]}`);
      }
      opts.limit = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

async function sourceCount(source: Client, table: string): Promise<number> {
  const res = await source.execute(`SELECT count(*) AS c FROM ${table}`);
  return Number(res.rows[0]?.c ?? 0);
}

async function validateTargetSchema(
  target: ReturnType<typeof drizzle>
): Promise<void> {
  for (const t of TABLES_TRUNCATE_ORDER) {
    try {
      await target.execute(sql.raw(`SELECT 1 FROM "${t}" LIMIT 0`));
    } catch (err) {
      throw new Error(
        `Target schema missing table "${t}". Run \`npm run db:migrate\` against DATABASE_URL first. (${(err as Error).message})`
      );
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const pgUrl = process.env.DATABASE_URL;

  if (!tursoUrl) {
    console.error("TURSO_DATABASE_URL is required (source).");
    process.exit(1);
  }
  if (!pgUrl) {
    console.error("DATABASE_URL is required (target).");
    process.exit(1);
  }

  const source = createClient({
    url: tursoUrl,
    ...(tursoToken ? { authToken: tursoToken } : {}),
  });
  const pool = new Pool({ connectionString: pgUrl });
  const target = drizzle(pool);

  try {
    await validateTargetSchema(target);

    // Source row counts (always shown — useful for dry-run AND real runs).
    console.log("Source row counts:");
    const sourceCounts: Record<string, number> = {};
    for (const t of TABLES_TRUNCATE_ORDER) {
      sourceCounts[t] = await sourceCount(source, t);
      console.log(`  ${t.padEnd(22)} ${sourceCounts[t]}`);
    }

    if (opts.limit !== null) {
      console.log(`\nApplying --limit ${opts.limit} to opportunities (and dependents).`);
    }

    if (opts.dryRun) {
      console.log("\n--dry-run: no writes performed.");
      return;
    }

    // TRUNCATE all tables in one statement — Postgres requires that FK-linked
    // tables be truncated together, so we can't split per-table. Listing all
    // six explicitly (instead of CASCADE) is louder about scope and safer if
    // an unrelated table ever gains a reference to one of these.
    console.log("\nTruncating target tables...");
    await target.execute(
      sql.raw(
        `TRUNCATE TABLE ${TABLES_TRUNCATE_ORDER.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY`
      )
    );

    // users
    const userRows = (await source.execute("SELECT * FROM users")).rows;
    if (userRows.length > 0) {
      await target.insert(users).values(userRows.map(transformUser));
    }
    console.log(`  users                  ${userRows.length} inserted`);

    // accounts
    const accountRows = (await source.execute("SELECT * FROM accounts")).rows;
    if (accountRows.length > 0) {
      await target
        .insert(accounts)
        .values(accountRows.map(transformAccount));
    }
    console.log(`  accounts               ${accountRows.length} inserted`);

    // verification_tokens
    const vtRows = (
      await source.execute("SELECT * FROM verification_tokens")
    ).rows;
    if (vtRows.length > 0) {
      await target
        .insert(verificationTokens)
        .values(vtRows.map(transformVerificationToken));
    }
    console.log(`  verification_tokens    ${vtRows.length} inserted`);

    // opportunities (optionally limited)
    const oppQuery = opts.limit
      ? `SELECT * FROM opportunities ORDER BY created_at DESC LIMIT ${opts.limit}`
      : `SELECT * FROM opportunities`;
    const oppRows = (await source.execute(oppQuery)).rows;
    if (oppRows.length > 0) {
      await target
        .insert(opportunities)
        .values(oppRows.map(transformOpportunity));
    }
    console.log(`  opportunities          ${oppRows.length} inserted`);

    const oppIds = oppRows.map((r) => String(r.id));

    // status_history (filtered to inserted opportunities)
    const shRows =
      opts.limit && oppIds.length > 0
        ? (
            await source.execute({
              sql: `SELECT * FROM status_history WHERE opportunity_id IN (${oppIds.map(() => "?").join(",")})`,
              args: oppIds,
            })
          ).rows
        : opts.limit
          ? []
          : (await source.execute("SELECT * FROM status_history")).rows;
    if (shRows.length > 0) {
      await target
        .insert(statusHistory)
        .values(shRows.map(transformStatusHistory));
    }
    console.log(`  status_history         ${shRows.length} inserted`);

    // opportunity_comments (filtered to inserted opportunities)
    const ocRows =
      opts.limit && oppIds.length > 0
        ? (
            await source.execute({
              sql: `SELECT * FROM opportunity_comments WHERE opportunity_id IN (${oppIds.map(() => "?").join(",")})`,
              args: oppIds,
            })
          ).rows
        : opts.limit
          ? []
          : (
              await source.execute("SELECT * FROM opportunity_comments")
            ).rows;
    if (ocRows.length > 0) {
      await target
        .insert(opportunityComments)
        .values(ocRows.map(transformComment));
    }
    console.log(`  opportunity_comments   ${ocRows.length} inserted`);

    console.log("\nMigration complete.");
  } finally {
    source.close();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
