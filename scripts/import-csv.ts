import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync } from "fs";
import { nanoid } from "nanoid";
import { opportunities } from "../src/lib/db/schema";

const STATUS_MAP: Record<string, string> = {
  applied: "applied",
  "initial screen": "interviewing",
  declined: "rejected",
  rejected: "rejected",
  offered: "offered",
  accepted: "accepted",
  withdrawn: "withdrawn",
  saved: "saved",
};

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseLocation(workMode: string, details: string): string {
  const parts = [workMode, details].filter(Boolean);
  return parts.join(" - ") || "";
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-csv.ts <path-to-csv>");
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const client = createClient(
    url ? { url, authToken } : { url: "file:local.db" }
  );
  const db = drizzle(client);

  const csv = readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());
  const [_header, ...rows] = lines;

  let imported = 0;
  let skipped = 0;

  for (const line of rows) {
    const [applicationDate, company, role, workMode, locationDetails, status, jobUrl] =
      parseCsvLine(line);

    const mappedStatus = STATUS_MAP[status.toLowerCase()] ?? "saved";
    const now = new Date().toISOString();

    if (!company) {
      skipped++;
      continue;
    }

    await db.insert(opportunities).values({
      id: nanoid(),
      company,
      role: role || "Unknown Role",
      url: jobUrl || null,
      status: mappedStatus,
      location: parseLocation(workMode, locationDetails) || null,
      appliedAt: parseDate(applicationDate),
      createdAt: now,
      updatedAt: now,
      archived: 0,
    });

    imported++;
    console.log(`  Imported: ${company} - ${role || "Unknown Role"} (${mappedStatus})`);
  }

  console.log(`\nDone! Imported ${imported} opportunities, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
