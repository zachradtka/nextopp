import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
    index("idx_accounts_user_id").on(account.userId),
  ]
);

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

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
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type StatusHistory = typeof statusHistory.$inferSelect;
export type NewStatusHistory = typeof statusHistory.$inferInsert;
