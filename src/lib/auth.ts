import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "./db";
import { users } from "./db/schema";

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
        // Use GitHub's numeric user ID as our stable identifier
        // (token.sub is unstable with JWT strategy and no DB adapter)
        const githubId = String(profile.id);
        token.userId = githubId;

        const now = new Date().toISOString();
        await db
          .insert(users)
          .values({
            id: githubId,
            name: (profile.name as string) ?? null,
            email: (profile.email as string) ?? "",
            image: (profile.avatar_url as string) ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              name: (profile.name as string) ?? undefined,
              image: (profile.avatar_url as string) ?? undefined,
              updatedAt: now,
            },
          });
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
