import { describe, it, expect } from "vitest";
import {
  intBool,
  msToDate,
  transformAccount,
  transformComment,
  transformOpportunity,
  transformStatusHistory,
  transformUser,
  transformVerificationToken,
} from "./migrate-transform";

describe("intBool", () => {
  it("0 -> false, 1 -> true", () => {
    expect(intBool(0)).toBe(false);
    expect(intBool(1)).toBe(true);
  });

  it("null -> false (treats absent flag as default)", () => {
    expect(intBool(null)).toBe(false);
    expect(intBool(undefined)).toBe(false);
  });

  it("string '0'/'1' (libsql sometimes returns ints as strings)", () => {
    expect(intBool("0")).toBe(false);
    expect(intBool("1")).toBe(true);
  });

  it("throws on unexpected values", () => {
    expect(() => intBool(2)).toThrow();
    expect(() => intBool("yes")).toThrow();
  });
});

describe("msToDate", () => {
  it("ms-since-epoch -> Date", () => {
    const d = msToDate(1_700_000_000_000);
    expect(d).toBeInstanceOf(Date);
    expect(d!.getTime()).toBe(1_700_000_000_000);
  });

  it("null -> null", () => {
    expect(msToDate(null)).toBeNull();
    expect(msToDate(undefined)).toBeNull();
  });

  it("numeric string (libsql sometimes returns ints as strings)", () => {
    const d = msToDate("1700000000000");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getTime()).toBe(1_700_000_000_000);
  });

  it("throws on non-numeric string", () => {
    expect(() => msToDate("not a number")).toThrow();
  });
});

describe("transformUser", () => {
  it("preserves ISO timestamps, converts ms emailVerified to Date", () => {
    const out = transformUser({
      id: "u1",
      name: "Zach",
      email: "z@example.com",
      emailVerified: 1_700_000_000_000,
      image: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    });
    expect(out.id).toBe("u1");
    expect(out.email).toBe("z@example.com");
    expect(out.emailVerified).toBeInstanceOf(Date);
    expect((out.emailVerified as Date).getTime()).toBe(1_700_000_000_000);
    expect(out.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(out.updatedAt).toBe("2026-01-02T00:00:00Z");
  });

  it("handles null emailVerified", () => {
    const out = transformUser({
      id: "u1",
      name: null,
      email: "z@example.com",
      emailVerified: null,
      image: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(out.emailVerified).toBeNull();
  });
});

describe("transformAccount", () => {
  it("preserves Auth.js OAuth shape (expires_at is seconds, not ms)", () => {
    const out = transformAccount({
      userId: "u1",
      type: "oauth",
      provider: "github",
      providerAccountId: "12345",
      refresh_token: null,
      access_token: "tok",
      expires_at: 1_700_000_000,
      token_type: "bearer",
      scope: "read:user",
      id_token: null,
      session_state: null,
    });
    expect(out.expires_at).toBe(1_700_000_000);
    expect(out.provider).toBe("github");
  });
});

describe("transformVerificationToken", () => {
  it("converts ms expires to Date", () => {
    const out = transformVerificationToken({
      identifier: "z@example.com",
      token: "abc",
      expires: 1_700_000_000_000,
    });
    expect(out.expires).toBeInstanceOf(Date);
    expect(out.expires.getTime()).toBe(1_700_000_000_000);
  });

  it("throws if expires is null (required field)", () => {
    expect(() =>
      transformVerificationToken({
        identifier: "z@example.com",
        token: "abc",
        expires: null,
      })
    ).toThrow();
  });
});

describe("transformOpportunity", () => {
  it("archived 0 -> false, 1 -> true, dates pass through as strings", () => {
    const out = transformOpportunity({
      id: "o1",
      user_id: "u1",
      company: "Acme",
      role: "Backend Engineer",
      url: "https://example.com",
      status: "applied",
      salary_min: 150000,
      salary_max: 200000,
      work_mode: "remote",
      location: "SF",
      department: null,
      employment_type: "full-time",
      experience_level: "senior",
      job_id: "R-123",
      date_posted: "2026-01-15",
      contact_name: null,
      job_description: null,
      applied_at: "2026-01-20",
      responded_at: null,
      created_at: "2026-01-20T10:00:00Z",
      updated_at: "2026-01-20T10:00:00Z",
      archived: 1,
    });
    expect(out.archived).toBe(true);
    expect(out.appliedAt).toBe("2026-01-20");
    expect(out.datePosted).toBe("2026-01-15");
    expect(out.respondedAt).toBeNull();
    expect(out.salaryMin).toBe(150000);
  });

  it("handles minimal row with most fields null", () => {
    const out = transformOpportunity({
      id: "o1",
      user_id: "u1",
      company: "Acme",
      role: "Engineer",
      url: null,
      status: "saved",
      salary_min: null,
      salary_max: null,
      work_mode: null,
      location: null,
      department: null,
      employment_type: null,
      experience_level: null,
      job_id: null,
      date_posted: null,
      contact_name: null,
      job_description: null,
      applied_at: null,
      responded_at: null,
      created_at: "2026-01-20T10:00:00Z",
      updated_at: "2026-01-20T10:00:00Z",
      archived: 0,
    });
    expect(out.archived).toBe(false);
    expect(out.url).toBeNull();
    expect(out.salaryMin).toBeNull();
  });
});

describe("transformStatusHistory", () => {
  it("preserves all fields", () => {
    const out = transformStatusHistory({
      id: "s1",
      opportunity_id: "o1",
      status: "interviewing",
      note: "first call scheduled",
      changed_at: "2026-02-01T15:00:00Z",
    });
    expect(out.opportunityId).toBe("o1");
    expect(out.status).toBe("interviewing");
    expect(out.note).toBe("first call scheduled");
    expect(out.changedAt).toBe("2026-02-01T15:00:00Z");
  });
});

describe("transformComment", () => {
  it("preserves all fields", () => {
    const out = transformComment({
      id: "c1",
      opportunity_id: "o1",
      body: "great team",
      created_at: "2026-02-01T15:00:00Z",
      updated_at: "2026-02-01T16:00:00Z",
    });
    expect(out.body).toBe("great team");
    expect(out.createdAt).toBe("2026-02-01T15:00:00Z");
    expect(out.updatedAt).toBe("2026-02-01T16:00:00Z");
  });
});
