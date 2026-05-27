/**
 * Throwaway seed for landing-page screenshots.
 *
 * Creates a fresh PGlite database at the path passed in argv[2], applies the
 * migrations in drizzle/, and imports scripts/sample-data.csv against the
 * `local-dev-user` user.
 *
 * Intentionally points at a separate PGlite directory (not the operator's
 * ./data/pglite) so it never touches their working dev database. Not
 * committed-pipeline machinery — this is a one-off support script for the
 * marketing screenshots in issue #88 and #89.
 */

import { readFileSync, mkdirSync } from "node:fs";
import { nanoid } from "nanoid";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { opportunities, statusHistory, users } from "../src/lib/db/schema";

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
      "Usage: tsx scripts/seed-marketing-demo.ts <pglite-dir> [csv-path]"
    );
    process.exit(1);
  }

  mkdirSync(dbPath, { recursive: true });
  const client = new PGlite(dbPath);
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  const userId = "local-dev-user";
  const now = new Date().toISOString();
  await db
    .insert(users)
    .values({
      id: userId,
      name: "Demo User",
      email: "demo@nextopp.local",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  const csv = readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());
  const [, ...rows] = lines;

  let imported = 0;
  for (const line of rows) {
    const [
      applicationDate,
      company,
      role,
      workMode,
      locationDetails,
      status,
      jobUrl,
    ] = parseCsvLine(line);
    if (!company) continue;

    const mappedStatus = STATUS_MAP[status.toLowerCase()] ?? "saved";
    const mappedWorkMode = WORK_MODE_MAP[workMode.toLowerCase()] ?? null;
    const id = nanoid();

    await db.insert(opportunities).values({
      id,
      userId,
      company,
      role: role || "Unknown Role",
      url: jobUrl || null,
      status: mappedStatus,
      workMode: mappedWorkMode,
      location: locationDetails || null,
      appliedAt: parseDate(applicationDate),
      createdAt: now,
      updatedAt: now,
      archived: false,
    });

    await db.insert(statusHistory).values({
      id: nanoid(),
      opportunityId: id,
      status: mappedStatus,
      changedAt: now,
    });

    imported++;
  }

  await client.close();
  console.log(`Seeded ${imported} opportunities into ${dbPath}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
