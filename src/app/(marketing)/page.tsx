import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { Hero } from "./_components/Hero";
import { FeatureSection } from "./_components/FeatureSection";
import { CtaBand } from "./_components/CtaBand";
import { landingFeatures } from "./_lib/landing-features";

export const metadata: Metadata = {
  title: "NextOpp — track your interviewing journey",
  description:
    "A central place to track job applications, manage your interview pipeline, and log every update along the way.",
};

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
      <Hero />
      <FeatureSection features={landingFeatures} />
      <CtaBand />
    </div>
  );
}
