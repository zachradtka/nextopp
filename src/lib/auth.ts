import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, verificationTokens } from "./db/schema";

const allowedUsers = process.env.ALLOWED_USERS?.split(",").map((u) =>
  u.trim().toLowerCase()
);

export function getEnabledProviders() {
  return {
    github: Boolean(process.env.AUTH_GITHUB_ID),
    google: Boolean(process.env.AUTH_GOOGLE_ID),
    linkedin: Boolean(process.env.AUTH_LINKEDIN_ID),
    resend: Boolean(process.env.AUTH_RESEND_KEY),
  };
}

function buildProviders() {
  const enabled = getEnabledProviders();
  const providers = [];

  if (enabled.github) {
    providers.push(GitHub);
  }
  if (enabled.google) {
    providers.push(Google);
  }
  if (enabled.linkedin) {
    providers.push(LinkedIn);
  }
  if (enabled.resend) {
    providers.push(
      Resend({
        apiKey: process.env.AUTH_RESEND_KEY,
        from: process.env.AUTH_EMAIL_FROM ?? "NextOpp <noreply@resend.dev>",
      })
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db as never, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  } as never),
  providers: buildProviders(),
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verified=1",
  },
  callbacks: {
    signIn({ user, profile, account }) {
      if (!allowedUsers || allowedUsers.length === 0) return true;

      // For email/magic link, check email against allow list
      if (account?.provider === "resend") {
        return allowedUsers.includes(user.email?.toLowerCase() ?? "");
      }

      // For GitHub, check login username or email
      if (account?.provider === "github") {
        const login = (profile?.login as string)?.toLowerCase();
        if (login && allowedUsers.includes(login)) return true;
      }

      // For all providers, check email against allow list
      const email =
        user.email?.toLowerCase() ?? profile?.email?.toString().toLowerCase();
      if (email && allowedUsers.includes(email)) return true;

      return false;
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
