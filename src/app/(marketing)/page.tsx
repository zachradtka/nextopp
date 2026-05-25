import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { Hero } from "./_components/Hero";
import { CaptureShowcase } from "./_components/CaptureShowcase";
import { FeatureSection } from "./_components/FeatureSection";
import { CtaBand } from "./_components/CtaBand";
import { landingFeatures } from "./_lib/landing-features";

export const metadata: Metadata = {
  title: "NextOpp — track your interviewing journey",
  description:
    "Paste a job link or description. NextOpp's AI turns it into an Opportunity so you can track your search without the data entry.",
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
      <CaptureShowcase />
      <FeatureSection features={landingFeatures} />
      <CtaBand />
    </div>
  );
}
