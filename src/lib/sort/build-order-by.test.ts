import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { opportunities } from "@/lib/db/schema";
import { buildOrderBy } from "./build-order-by";
import type { SortState } from "./types";

const CREATE_TABLE_SQL = `
  CREATE TABLE opportunities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'u',
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'saved',
    salary_min INTEGER,
    salary_max INTEGER,
    work_mode TEXT,
    location TEXT,
    department TEXT,
    employment_type TEXT,
    experience_level TEXT,
    job_id TEXT,
    date_posted TEXT,
    contact_name TEXT,
    job_description TEXT,
    applied_at TEXT,
    responded_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    archived INTEGER NOT NULL DEFAULT 0
  );
`;

type TestRow = {
  id: string;
  company?: string;
  role?: string;
  status?: string;
  appliedAt?: string | null;
  updatedAt: string;
};

function setupDb(rows: TestRow[]): BetterSQLite3Database {
  const sqlite = new Database(":memory:");
  sqlite.exec(CREATE_TABLE_SQL);
  const db = drizzle(sqlite);
  for (const r of rows) {
    db.insert(opportunities)
      .values({
        id: r.id,
        userId: "u",
        company: r.company ?? "Co",
        role: r.role ?? "Role",
        status: r.status ?? "saved",
        appliedAt: r.appliedAt ?? null,
        createdAt: r.updatedAt,
        updatedAt: r.updatedAt,
      })
      .run();
  }
  return db;
}

function orderedIds(
  db: BetterSQLite3Database,
  state: SortState | null,
): string[] {
  const rows = db
    .select({ id: opportunities.id })
    .from(opportunities)
    .orderBy(...buildOrderBy(state))
    .all();
  return rows.map((r) => r.id);
}

describe("buildOrderBy", () => {
  describe("null state (default)", () => {
    it("returns updatedAt DESC then id ASC", () => {
      const db = setupDb([
        { id: "a", updatedAt: "2025-02-01" },
        { id: "c", updatedAt: "2025-03-01" },
        { id: "b1", updatedAt: "2025-01-01" },
        { id: "b2", updatedAt: "2025-01-01" },
      ]);
      // c (latest) → a → b1, b2 (tie broken by id ASC)
      expect(orderedIds(db, null)).toEqual(["c", "a", "b1", "b2"]);
    });
  });

  describe("company", () => {
    const rows: TestRow[] = [
      { id: "r1", company: "Alpha", role: "Junior", updatedAt: "2025-01-01" },
      { id: "r2", company: "Alpha", role: "Senior", updatedAt: "2025-01-01" },
      { id: "r3", company: "Beta", role: "Junior", updatedAt: "2025-01-01" },
      { id: "r4", company: "Beta", role: "Senior", updatedAt: "2025-01-01" },
    ];

    it("ASC sorts by company, then role ASC, then id ASC", () => {
      const db = setupDb(rows);
      expect(orderedIds(db, { column: "company", direction: "asc" })).toEqual([
        "r1",
        "r2",
        "r3",
        "r4",
      ]);
    });

    it("DESC sorts by company DESC; role tie-breaker stays ASC", () => {
      const db = setupDb(rows);
      // Beta first (DESC), but within Beta, Junior (r3) still precedes Senior (r4)
      expect(orderedIds(db, { column: "company", direction: "desc" })).toEqual([
        "r3",
        "r4",
        "r1",
        "r2",
      ]);
    });

    it("breaks ties on identical company + role with id ASC", () => {
      const db = setupDb([
        { id: "z", company: "Alpha", role: "Junior", updatedAt: "2025-01-01" },
        { id: "a", company: "Alpha", role: "Junior", updatedAt: "2025-01-01" },
      ]);
      expect(orderedIds(db, { column: "company", direction: "asc" })).toEqual([
        "a",
        "z",
      ]);
    });
  });

  describe("status (workflow order)", () => {
    // STATUSES order: saved=0, applied=1, interviewing=2, offered=3,
    // rejected=4, withdrawn=5, accepted=6
    const rows: TestRow[] = [
      { id: "saved-old", status: "saved", updatedAt: "2025-01-01" },
      { id: "saved-new", status: "saved", updatedAt: "2025-04-01" },
      { id: "applied", status: "applied", updatedAt: "2025-02-01" },
      { id: "interviewing", status: "interviewing", updatedAt: "2025-03-01" },
      { id: "accepted", status: "accepted", updatedAt: "2025-01-15" },
    ];

    it("ASC follows workflow order; ties broken by updatedAt DESC", () => {
      const db = setupDb(rows);
      expect(orderedIds(db, { column: "status", direction: "asc" })).toEqual([
        // both saved: newer first by updatedAt DESC
        "saved-new",
        "saved-old",
        "applied",
        "interviewing",
        "accepted",
      ]);
    });

    it("DESC reverses workflow order; updatedAt tie-breaker stays DESC", () => {
      const db = setupDb(rows);
      expect(orderedIds(db, { column: "status", direction: "desc" })).toEqual([
        "accepted",
        "interviewing",
        "applied",
        "saved-new",
        "saved-old",
      ]);
    });
  });

  describe("applied_at", () => {
    it("ASC sorts by appliedAt ASC; ties broken by updatedAt DESC then id ASC", () => {
      const db = setupDb([
        { id: "a", appliedAt: "2025-01-01", updatedAt: "2025-05-01" },
        { id: "b", appliedAt: "2025-02-01", updatedAt: "2025-04-01" },
        // tie on appliedAt: c has newer updatedAt → first
        { id: "c", appliedAt: "2025-03-01", updatedAt: "2025-06-01" },
        { id: "d", appliedAt: "2025-03-01", updatedAt: "2025-01-01" },
      ]);
      expect(
        orderedIds(db, { column: "applied_at", direction: "asc" }),
      ).toEqual(["a", "b", "c", "d"]);
    });

    it("DESC sorts by appliedAt DESC; updatedAt tie-breaker stays DESC", () => {
      const db = setupDb([
        { id: "a", appliedAt: "2025-01-01", updatedAt: "2025-05-01" },
        { id: "b", appliedAt: "2025-02-01", updatedAt: "2025-04-01" },
        { id: "c", appliedAt: "2025-03-01", updatedAt: "2025-06-01" },
        { id: "d", appliedAt: "2025-03-01", updatedAt: "2025-01-01" },
      ]);
      expect(
        orderedIds(db, { column: "applied_at", direction: "desc" }),
      ).toEqual(["c", "d", "b", "a"]);
    });
  });

  describe("updated_at", () => {
    it("ASC sorts by updatedAt; ties broken by company ASC then id ASC", () => {
      const db = setupDb([
        { id: "r1", company: "Beta", updatedAt: "2025-01-01" },
        { id: "r2", company: "Alpha", updatedAt: "2025-02-01" },
        { id: "r3", company: "Charlie", updatedAt: "2025-02-01" },
      ]);
      expect(
        orderedIds(db, { column: "updated_at", direction: "asc" }),
      ).toEqual(["r1", "r2", "r3"]);
    });

    it("DESC sorts by updatedAt DESC; company tie-breaker stays ASC", () => {
      const db = setupDb([
        { id: "r1", company: "Beta", updatedAt: "2025-01-01" },
        { id: "r2", company: "Alpha", updatedAt: "2025-02-01" },
        { id: "r3", company: "Charlie", updatedAt: "2025-02-01" },
      ]);
      // Newest first; among ties, Alpha before Charlie (ASC); Beta last
      expect(
        orderedIds(db, { column: "updated_at", direction: "desc" }),
      ).toEqual(["r2", "r3", "r1"]);
    });
  });
});
