"use server";

import { db } from "@/lib/db";
import { opportunities, statusHistory, opportunityComments } from "@/lib/db/schema";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { Status } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-optional";
import { parseFormData, type OpportunityFormState } from "@/lib/validations/opportunity";

async function assertOpportunityOwnership(opportunityId: string, userId: string) {
  const rows = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.userId, userId)))
    .limit(1);

  if (!rows[0]) {
    throw new Error("Opportunity not found");
  }
}

async function recordStatusChange(
  opportunityId: string,
  status: string,
  note?: string | null
) {
  await db.insert(statusHistory).values({
    id: nanoid(),
    opportunityId,
    status,
    note: note ?? null,
    changedAt: new Date().toISOString(),
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getStatusCounts(
  showArchived = false,
  search?: string
): Promise<Record<string, number>> {
  const userId = await requireUserId();
  const conditions = [
    eq(opportunities.userId, userId),
    eq(opportunities.archived, showArchived ? 1 : 0),
  ];

  if (search) {
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${escaped}%`;
    conditions.push(
      sql`(${opportunities.company} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.role} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.jobId} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.location} LIKE ${pattern} ESCAPE '\\')`
    );
  }

  const rows = await db
    .select({
      status: opportunities.status,
      count: sql<number>`count(*)`,
    })
    .from(opportunities)
    .where(and(...conditions))
    .groupBy(opportunities.status);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = row.count;
  }
  return counts;
}

export async function listOpportunities(
  statusFilter?: Status | "all",
  showArchived = false,
  search?: string
) {
  const userId = await requireUserId();
  const conditions = [
    eq(opportunities.userId, userId),
    eq(opportunities.archived, showArchived ? 1 : 0),
  ];

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(opportunities.status, statusFilter));
  }

  if (search) {
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${escaped}%`;
    conditions.push(
      sql`(${opportunities.company} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.role} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.jobId} LIKE ${pattern} ESCAPE '\\' OR ${opportunities.location} LIKE ${pattern} ESCAPE '\\')`
    );
  }

  return db
    .select()
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(desc(opportunities.createdAt));
}

export async function getOpportunity(id: string) {
  const userId = await requireUserId();
  const results = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1);

  return results[0] ?? null;
}

export async function getStatusHistory(opportunityId: string) {
  return db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.opportunityId, opportunityId))
    .orderBy(asc(statusHistory.changedAt));
}

export async function getComments(opportunityId: string) {
  const userId = await requireUserId();
  await assertOpportunityOwnership(opportunityId, userId);

  return db
    .select()
    .from(opportunityComments)
    .where(eq(opportunityComments.opportunityId, opportunityId))
    .orderBy(asc(opportunityComments.createdAt));
}

export async function addComment(opportunityId: string, body: string) {
  const userId = await requireUserId();
  await assertOpportunityOwnership(opportunityId, userId);

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty");
  }

  const now = new Date().toISOString();
  await db.insert(opportunityComments).values({
    id: nanoid(),
    opportunityId,
    body: trimmed,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/opportunities/${opportunityId}`);
}

async function getOwnedCommentOpportunityId(commentId: string, userId: string) {
  const rows = await db
    .select({ opportunityId: opportunityComments.opportunityId })
    .from(opportunityComments)
    .innerJoin(
      opportunities,
      eq(opportunities.id, opportunityComments.opportunityId)
    )
    .where(
      and(
        eq(opportunityComments.id, commentId),
        eq(opportunities.userId, userId)
      )
    )
    .limit(1);

  if (!rows[0]) {
    throw new Error("Comment not found");
  }
  return rows[0].opportunityId;
}

export async function updateComment(commentId: string, body: string) {
  const userId = await requireUserId();
  const opportunityId = await getOwnedCommentOpportunityId(commentId, userId);

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty");
  }

  await db
    .update(opportunityComments)
    .set({ body: trimmed, updatedAt: new Date().toISOString() })
    .where(eq(opportunityComments.id, commentId));

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function deleteComment(commentId: string) {
  const userId = await requireUserId();
  const opportunityId = await getOwnedCommentOpportunityId(commentId, userId);

  await db
    .delete(opportunityComments)
    .where(eq(opportunityComments.id, commentId));

  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function createOpportunity(
  prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState & { id?: string }> {
  const userId = await requireUserId();
  const result = parseFormData(formData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as OpportunityFormState["errors"],
      message: "Validation failed. Please check the form for errors.",
    };
  }

  const data = result.data;
  const id = nanoid();
  const now = new Date().toISOString();
  const appliedAt =
    data.status === "applied" && !data.appliedAt ? todayIsoDate() : data.appliedAt;

  await db.insert(opportunities).values({
    id,
    userId,
    company: data.company,
    role: data.role,
    url: data.url,
    status: data.status,
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    workMode: data.workMode,
    location: data.location,
    department: data.department,
    employmentType: data.employmentType,
    experienceLevel: data.experienceLevel,
    jobId: data.jobId,
    datePosted: data.datePosted,
    contactName: data.contactName,
    jobDescription: data.jobDescription,
    appliedAt,
    createdAt: now,
    updatedAt: now,
  });

  await recordStatusChange(id, data.status);

  revalidatePath("/opportunities");
  return { id };
}

export async function updateOpportunity(
  id: string,
  prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const userId = await requireUserId();
  const result = parseFormData(formData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as OpportunityFormState["errors"],
      message: "Validation failed. Please check the form for errors.",
    };
  }

  const data = result.data;

  // Check if status changed
  const existing = await db
    .select({ status: opportunities.status })
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1);

  const statusChanged = existing[0] && existing[0].status !== data.status;
  const appliedAt =
    statusChanged && data.status === "applied" && !data.appliedAt
      ? todayIsoDate()
      : data.appliedAt;

  await db
    .update(opportunities)
    .set({
      company: data.company,
      role: data.role,
      url: data.url,
      status: data.status,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      workMode: data.workMode,
      location: data.location,
      department: data.department,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      jobId: data.jobId,
      datePosted: data.datePosted,
      contactName: data.contactName,
      jobDescription: data.jobDescription,
      appliedAt,
      respondedAt: data.respondedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  if (statusChanged) {
    await recordStatusChange(id, data.status);
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  return {};
}

export async function updateOpportunityStatus(id: string, status: Status) {
  const userId = await requireUserId();

  const existing = await db
    .select({ status: opportunities.status, appliedAt: opportunities.appliedAt })
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    throw new Error("Opportunity not found");
  }
  if (existing[0].status === status) {
    return;
  }

  await db
    .update(opportunities)
    .set({
      status,
      ...(status === "applied" && !existing[0].appliedAt
        ? { appliedAt: todayIsoDate() }
        : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  await recordStatusChange(id, status);

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
}

export async function archiveOpportunity(id: string) {
  const userId = await requireUserId();

  await db
    .update(opportunities)
    .set({
      archived: 1,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  revalidatePath("/opportunities");
}

export async function unarchiveOpportunity(id: string) {
  const userId = await requireUserId();

  await db
    .update(opportunities)
    .set({
      archived: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  revalidatePath("/opportunities");
}

export async function deleteOpportunity(id: string) {
  const userId = await requireUserId();

  await db
    .delete(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  revalidatePath("/opportunities");
}
