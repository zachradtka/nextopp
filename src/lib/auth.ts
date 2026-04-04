import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const allowedUsers = process.env.ALLOWED_USERS?.split(",").map((u) => u.trim());

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    signIn({ profile }) {
      if (!allowedUsers || allowedUsers.length === 0) return true;
      return allowedUsers.includes(profile?.login as string);
    },
    async jwt({ token, profile }) {
      if (profile) {
        // Sync user to database on sign-in
        const now = new Date().toISOString();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.id, token.sub!))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            id: token.sub!,
            name: (profile.name as string) ?? null,
            email: (profile.email as string) ?? "",
            image: (profile.avatar_url as string) ?? null,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          await db
            .update(users)
            .set({
              name: (profile.name as string) ?? existing[0].name,
              image: (profile.avatar_url as string) ?? existing[0].image,
              updatedAt: now,
            })
            .where(eq(users.id, token.sub!));
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
