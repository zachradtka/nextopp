import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  url: text("url"),
  status: text("status").notNull().default("saved"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  location: text("location"),
  notes: text("notes"),
  appliedAt: text("applied_at"),
  respondedAt: text("responded_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  archived: integer("archived").notNull().default(0),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
