import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Resend as ResendClient } from "resend";
import { MagicLinkEmail } from "../../emails/magic-link";
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
    const apiKey = process.env.AUTH_RESEND_KEY!;
    const from =
      process.env.AUTH_EMAIL_FROM ?? "NextOpp <onboarding@resend.dev>";
    const resendClient = new ResendClient(apiKey);

    providers.push(
      Resend({
        apiKey,
        from,
        maxAge: 30 * 60,
        async sendVerificationRequest({ identifier: email, url }) {
          const { host, origin } = new URL(url);
          const { error } = await resendClient.emails.send({
            from,
            to: email,
            subject: "Sign in to NextOpp",
            react: MagicLinkEmail({
              url,
              host,
              iconUrl: `${origin}/email/icon.png`,
            }),
          });
          if (error) {
            throw new Error(
              `Resend failed to send magic link: ${error.message}`
            );
          }
        },
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
    verifyRequest: "/login",
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
