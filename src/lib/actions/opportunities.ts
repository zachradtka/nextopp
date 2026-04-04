"use server";

import { db } from "@/lib/db";
import { opportunities, statusHistory } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { Status } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-optional";

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
  showArchived = false
) {
  const userId = await requireUserId();
  const conditions = [eq(opportunities.userId, userId)];

  if (!showArchived) {
    conditions.push(eq(opportunities.archived, 0));
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(opportunities.status, statusFilter));
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

export async function createOpportunity(formData: FormData) {
  const userId = await requireUserId();
  const id = nanoid();
  const now = new Date().toISOString();
  const status = (formData.get("status") as string) || "saved";

  await db.insert(opportunities).values({
    id,
    userId,
    company: formData.get("company") as string,
    role: formData.get("role") as string,
    url: (formData.get("url") as string) || null,
    status,
    salaryMin: formData.get("salaryMin")
      ? Number(formData.get("salaryMin"))
      : null,
    salaryMax: formData.get("salaryMax")
      ? Number(formData.get("salaryMax"))
      : null,
    workMode: (formData.get("workMode") as string) || null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    appliedAt: (formData.get("appliedAt") as string) || null,
    createdAt: now,
    updatedAt: now,
  });

  await recordStatusChange(id, status);

  revalidatePath("/");
  return { id };
}

export async function updateOpportunity(id: string, formData: FormData) {
  const userId = await requireUserId();
  const newStatus = (formData.get("status") as string) || "saved";

  // Check if status changed
  const existing = await db
    .select({ status: opportunities.status })
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1);

  await db
    .update(opportunities)
    .set({
      company: formData.get("company") as string,
      role: formData.get("role") as string,
      url: (formData.get("url") as string) || null,
      status: newStatus,
      salaryMin: formData.get("salaryMin")
        ? Number(formData.get("salaryMin"))
        : null,
      salaryMax: formData.get("salaryMax")
        ? Number(formData.get("salaryMax"))
        : null,
      workMode: (formData.get("workMode") as string) || null,
      location: (formData.get("location") as string) || null,
      notes: (formData.get("notes") as string) || null,
      appliedAt: (formData.get("appliedAt") as string) || null,
      respondedAt: (formData.get("respondedAt") as string) || null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));

  if (existing[0] && existing[0].status !== newStatus) {
    await recordStatusChange(id, newStatus);
  }

  revalidatePath("/");
  revalidatePath(`/opportunities/${id}`);
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
