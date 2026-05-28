/**
 * Pure transforms for migrating Turso (SQLite) rows to Neon (Postgres).
 *
 * The OLD schema (Turso) stored:
 *   - archived: integer (0/1)
 *   - emailVerified / verification_tokens.expires: integer ms-since-epoch
 *   - createdAt/updatedAt/changedAt: text ISO string
 *   - appliedAt/respondedAt/datePosted: text YYYY-MM-DD
 *   - accounts.expires_at: integer seconds-since-epoch (Auth.js OAuth — unchanged shape)
 *
 * The NEW schema (Postgres) expects:
 *   - archived: boolean
 *   - emailVerified / verification_tokens.expires: Date (timestamp mode "date")
 *   - createdAt/updatedAt/changedAt: ISO string (timestamptz mode "string")
 *   - appliedAt/respondedAt/datePosted: YYYY-MM-DD string (date mode "string")
 *
 * Everything else passes through unchanged.
 */

import type {
  NewAccount,
  NewOpportunity,
  NewOpportunityComment,
  NewStatusHistory,
  NewUser,
} from "../../src/lib/db/schema";

type SourceRow = Record<string, unknown>;

export function intBool(v: unknown): boolean {
  if (v === 1 || v === "1" || v === true) return true;
  if (v === 0 || v === "0" || v === false || v == null) return false;
  throw new Error(`intBool: unexpected value ${JSON.stringify(v)}`);
}

export function msToDate(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return new Date(Number(v));
  throw new Error(`msToDate: unexpected value ${JSON.stringify(v)}`);
}

function str(v: unknown): string | null {
  if (v == null) return null;
  return String(v);
}

function int(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  throw new Error(`int: unexpected value ${JSON.stringify(v)}`);
}

function reqStr(v: unknown, field: string): string {
  const s = str(v);
  if (s === null) throw new Error(`required field ${field} was null`);
  return s;
}

export function transformUser(row: SourceRow): NewUser {
  return {
    id: reqStr(row.id, "users.id"),
    name: str(row.name),
    email: reqStr(row.email, "users.email"),
    emailVerified: msToDate(row.emailVerified),
    image: str(row.image),
    createdAt: reqStr(row.created_at, "users.created_at"),
    updatedAt: reqStr(row.updated_at, "users.updated_at"),
  };
}

export function transformAccount(row: SourceRow): NewAccount {
  return {
    userId: reqStr(row.userId, "accounts.userId"),
    type: reqStr(row.type, "accounts.type"),
    provider: reqStr(row.provider, "accounts.provider"),
    providerAccountId: reqStr(
      row.providerAccountId,
      "accounts.providerAccountId"
    ),
    refresh_token: str(row.refresh_token),
    access_token: str(row.access_token),
    expires_at: int(row.expires_at),
    token_type: str(row.token_type),
    scope: str(row.scope),
    id_token: str(row.id_token),
    session_state: str(row.session_state),
  };
}

export function transformVerificationToken(row: SourceRow) {
  const expires = msToDate(row.expires);
  if (!expires) throw new Error(`verification_tokens.expires was null`);
  return {
    identifier: reqStr(row.identifier, "verification_tokens.identifier"),
    token: reqStr(row.token, "verification_tokens.token"),
    expires,
  };
}

export function transformOpportunity(row: SourceRow): NewOpportunity {
  return {
    id: reqStr(row.id, "opportunities.id"),
    userId: reqStr(row.user_id, "opportunities.user_id"),
    company: reqStr(row.company, "opportunities.company"),
    role: reqStr(row.role, "opportunities.role"),
    url: str(row.url),
    status: reqStr(row.status, "opportunities.status"),
    salaryMin: int(row.salary_min),
    salaryMax: int(row.salary_max),
    workMode: str(row.work_mode),
    location: str(row.location),
    department: str(row.department),
    employmentType: str(row.employment_type),
    experienceLevel: str(row.experience_level),
    jobId: str(row.job_id),
    datePosted: str(row.date_posted),
    contactName: str(row.contact_name),
    jobDescription: str(row.job_description),
    appliedAt: str(row.applied_at),
    respondedAt: str(row.responded_at),
    createdAt: reqStr(row.created_at, "opportunities.created_at"),
    updatedAt: reqStr(row.updated_at, "opportunities.updated_at"),
    archived: intBool(row.archived),
  };
}

export function transformStatusHistory(row: SourceRow): NewStatusHistory {
  return {
    id: reqStr(row.id, "status_history.id"),
    opportunityId: reqStr(row.opportunity_id, "status_history.opportunity_id"),
    status: reqStr(row.status, "status_history.status"),
    note: str(row.note),
    changedAt: reqStr(row.changed_at, "status_history.changed_at"),
  };
}

export function transformComment(row: SourceRow): NewOpportunityComment {
  return {
    id: reqStr(row.id, "opportunity_comments.id"),
    opportunityId: reqStr(
      row.opportunity_id,
      "opportunity_comments.opportunity_id"
    ),
    body: reqStr(row.body, "opportunity_comments.body"),
    createdAt: reqStr(row.created_at, "opportunity_comments.created_at"),
    updatedAt: reqStr(row.updated_at, "opportunity_comments.updated_at"),
  };
}
