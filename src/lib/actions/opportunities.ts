"use server";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { Status } from "@/lib/constants";

export async function listOpportunities(
  statusFilter?: Status | "all",
  showArchived = false
) {
  const conditions = [];

  if (!showArchived) {
    conditions.push(eq(opportunities.archived, 0));
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(opportunities.status, statusFilter));
  }

  return db
    .select()
    .from(opportunities)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(opportunities.updatedAt));
}

export async function getOpportunity(id: string) {
  const results = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  return results[0] ?? null;
}

export async function createOpportunity(formData: FormData) {
  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(opportunities).values({
    id,
    company: formData.get("company") as string,
    role: formData.get("role") as string,
    url: (formData.get("url") as string) || null,
    status: (formData.get("status") as string) || "saved",
    salaryMin: formData.get("salaryMin")
      ? Number(formData.get("salaryMin"))
      : null,
    salaryMax: formData.get("salaryMax")
      ? Number(formData.get("salaryMax"))
      : null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    appliedAt: (formData.get("appliedAt") as string) || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  return { id };
}

export async function updateOpportunity(id: string, formData: FormData) {
  await db
    .update(opportunities)
    .set({
      company: formData.get("company") as string,
      role: formData.get("role") as string,
      url: (formData.get("url") as string) || null,
      status: (formData.get("status") as string) || "saved",
      salaryMin: formData.get("salaryMin")
        ? Number(formData.get("salaryMin"))
        : null,
      salaryMax: formData.get("salaryMax")
        ? Number(formData.get("salaryMax"))
        : null,
      location: (formData.get("location") as string) || null,
      notes: (formData.get("notes") as string) || null,
      appliedAt: (formData.get("appliedAt") as string) || null,
      respondedAt: (formData.get("respondedAt") as string) || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(opportunities.id, id));

  revalidatePath("/");
  revalidatePath(`/opportunities/${id}`);
}

export async function updateOpportunityStatus(id: string, status: Status) {
  await db
    .update(opportunities)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(opportunities.id, id));

  revalidatePath("/");
}

export async function archiveOpportunity(id: string) {
  await db
    .update(opportunities)
    .set({
      archived: 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(opportunities.id, id));

  revalidatePath("/");
}

export async function unarchiveOpportunity(id: string) {
  await db
    .update(opportunities)
    .set({
      archived: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(opportunities.id, id));

  revalidatePath("/");
}

export async function deleteOpportunity(id: string) {
  await db.delete(opportunities).where(eq(opportunities.id, id));

  revalidatePath("/");
}
