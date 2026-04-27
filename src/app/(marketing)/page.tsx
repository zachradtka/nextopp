import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListChecks, GitBranch, MessageSquareText } from "lucide-react";
import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Opportunity Tracker — track your interviewing journey",
  description:
    "A central place to track job applications, manage your interview pipeline, and log every update along the way.",
};

const features = [
  {
    icon: ListChecks,
    title: "Track applications",
    body: "Capture every opportunity and watch it move from Saved to Applied to Interviewing — without losing track of where each role stands.",
  },
  {
    icon: GitBranch,
    title: "Pipeline at a glance",
    body: "Status counts, dashboards, and insights show your whole search at once so you know where to focus next.",
  },
  {
    icon: MessageSquareText,
    title: "Comments and timeline",
    body: "Log calls, interviews, and follow-ups as rich-text comments. Every opportunity has a full timeline of your conversation history.",
  },
];

export default async function LandingPage() {
  if (!isAuthEnabled()) {
    redirect("/opportunities");
  }
  const session = await getOptionalSession();
  if (session?.user) {
    redirect("/opportunities");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="flex flex-col items-center py-16 text-center sm:py-24 lg:py-32">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          A central place for your entire interviewing journey
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Track applications, manage your interview pipeline, and capture every
          conversation along the way — all in one place.
        </p>
        <div className="mt-8">
          <Link href="/api/auth/signin">
            <Button size="lg" className="h-11 px-6 text-base">
              Sign in to get started
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 pb-16 sm:gap-8 sm:pb-24 md:grid-cols-3 lg:pb-32">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col rounded-xl border border-border bg-card p-6 text-card-foreground"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
