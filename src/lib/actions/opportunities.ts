"use server";

import { db } from "@/lib/db";
import { opportunities, statusHistory } from "@/lib/db/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { Status } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-optional";
import { parseFormData, type OpportunityFormState } from "@/lib/validations/opportunity";

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

export async function listOpportunities(
  statusFilter?: Status | "all",
  showArchived = false,
  search?: string
) {
  const userId = await requireUserId();
  const conditions = [eq(opportunities.userId, userId)];

  if (!showArchived) {
    conditions.push(eq(opportunities.archived, 0));
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(opportunities.status, statusFilter));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(opportunities.company, pattern),
        like(opportunities.role, pattern),
        like(opportunities.jobId, pattern),
        like(opportunities.location, pattern)
      )!
    );
  }

  return db
    .select()
    .from(opportunities)
    .where(and(...conditions))
    .orderBy(desc(opportunities.updatedAt));
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
    .orderBy(desc(statusHistory.changedAt));
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
    notes: data.notes,
    appliedAt: data.appliedAt,
    createdAt: now,
    updatedAt: now,
  });

  await recordStatusChange(id, data.status);

  revalidatePath("/");
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
      notes: data.notes,
      appliedAt: data.appliedAt,
      respondedAt: data.respondedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  if (existing[0] && existing[0].status !== data.status) {
    await recordStatusChange(id, data.status);
  }

  revalidatePath("/");
  revalidatePath(`/opportunities/${id}`);
  return {};
}

export async function updateOpportunityStatus(id: string, status: Status) {
  const userId = await requireUserId();

  await db
    .update(opportunities)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  await recordStatusChange(id, status);

  revalidatePath("/");
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

  revalidatePath("/");
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

  revalidatePath("/");
}

export async function deleteOpportunity(id: string) {
  const userId = await requireUserId();

  await db
    .delete(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  revalidatePath("/");
}
