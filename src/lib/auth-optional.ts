import { auth } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const LOCAL_USER_ID = "local-dev-user";

async function ensureLocalUser() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, LOCAL_USER_ID))
    .limit(1);

  if (existing.length === 0) {
    const now = new Date().toISOString();
    await db.insert(users).values({
      id: LOCAL_USER_ID,
      name: "Local User",
      email: "local@localhost",
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getOptionalSession() {
  if (process.env.AUTH_DISABLED === "true") {
    await ensureLocalUser();
    return {
      user: { id: LOCAL_USER_ID, name: "Local User", email: "local@localhost" },
    };
  }
  return await auth();
}

export async function requireUserId(): Promise<string> {
  const session = await getOptionalSession();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export function isAuthEnabled() {
  return process.env.AUTH_DISABLED !== "true";
}
