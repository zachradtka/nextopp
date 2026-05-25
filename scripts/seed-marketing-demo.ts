/**
 * Throwaway seed for landing-page screenshots.
 *
 * Creates a fresh SQLite DB at the path passed in argv[2], applies the
 * migration in drizzle/0000_groovy_vapor.sql, and imports
 * scripts/sample-data.csv against the `local-dev-user` user.
 *
 * Intentionally bypasses src/lib/db/index.ts so it never touches the
 * operator's local.db or Turso. Not committed-pipeline machinery — this
 * is a one-off support script for the marketing screenshots in issue #88
 * and #89.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";

const STATUS_MAP: Record<string, string> = {
  applied: "applied",
  "initial screen": "interviewing",
  interviewing: "interviewing",
  declined: "rejected",
  rejected: "rejected",
  offered: "offered",
  accepted: "accepted",
  withdrawn: "withdrawn",
  saved: "saved",
};

const WORK_MODE_MAP: Record<string, string> = {
  remote: "remote",
  hybrid: "hybrid",
  onsite: "onsite",
  "on-site": "onsite",
  "in-office": "onsite",
  office: "onsite",
};

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else current += char;
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  const dbPath = process.argv[2];
  const csvPath = process.argv[3] ?? "scripts/sample-data.csv";
  if (!dbPath) {
    console.error(
      "Usage: tsx scripts/seed-marketing-demo.ts <db-path> [csv-path]"
    );
    process.exit(1);
  }

  const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`;
  const client = createClient({ url });

  const userId = "local-dev-user";
  const now = new Date().toISOString();
  await client.execute({
    sql: "INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
    args: [userId, "Demo User", "demo@nextopp.local", now, now],
  });

  const csv = readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());
  const [, ...rows] = lines;

  let imported = 0;
  for (const line of rows) {
    const [applicationDate, company, role, workMode, locationDetails, status, jobUrl] =
      parseCsvLine(line);
    if (!company) continue;

    const mappedStatus = STATUS_MAP[status.toLowerCase()] ?? "saved";
    const mappedWorkMode = WORK_MODE_MAP[workMode.toLowerCase()] ?? null;
    const id = nanoid();

    await client.execute({
      sql: `INSERT INTO opportunities
        (id, user_id, company, role, url, status, work_mode, location, applied_at, created_at, updated_at, archived)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        id,
        userId,
        company,
        role || "Unknown Role",
        jobUrl || null,
        mappedStatus,
        mappedWorkMode,
        locationDetails || null,
        parseDate(applicationDate),
        now,
        now,
      ],
    });

    await client.execute({
      sql: "INSERT INTO status_history (id, opportunity_id, status, changed_at) VALUES (?, ?, ?, ?)",
      args: [nanoid(), id, mappedStatus, now],
    });

    imported++;
  }

  console.log(`Seeded ${imported} opportunities into ${dbPath}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
