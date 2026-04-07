import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    company: text("company").notNull(),
    role: text("role").notNull(),
    url: text("url"),
    status: text("status").notNull().default("saved"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    workMode: text("work_mode"),
    location: text("location"),
    department: text("department"),
    employmentType: text("employment_type"),
    experienceLevel: text("experience_level"),
    jobId: text("job_id"),
    datePosted: text("date_posted"),
    contactName: text("contact_name"),
    jobDescription: text("job_description"),
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
  },
  (table) => [
    index("idx_opportunities_user_id").on(table.userId),
    index("idx_opportunities_user_status").on(table.userId, table.status),
    index("idx_opportunities_user_archived").on(table.userId, table.archived),
  ]
);

export const statusHistory = sqliteTable(
  "status_history",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note"),
    changedAt: text("changed_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_status_history_opp_changed").on(
      table.opportunityId,
      table.changedAt
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type StatusHistory = typeof statusHistory.$inferSelect;
export type NewStatusHistory = typeof statusHistory.$inferInsert;
