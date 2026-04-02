import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const allowedUsers = process.env.ALLOWED_USERS?.split(",").map((u) => u.trim());

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    signIn({ profile }) {
      if (!allowedUsers || allowedUsers.length === 0) return true;
      return allowedUsers.includes(profile?.login as string);
    },
  },
});
