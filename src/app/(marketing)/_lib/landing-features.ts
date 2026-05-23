import type { LucideIcon } from "lucide-react";

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
  flagKey: string | null;
};

export const landingFeatures: LandingFeature[] = [];
