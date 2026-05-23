import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  GitBranch,
  Archive,
  ListChecks,
  MessageSquareText,
} from "lucide-react";

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
  flagKey: string | null;
};

export const landingFeatures: LandingFeature[] = [
  {
    icon: Sparkles,
    title: "Capture",
    body: "Paste a job URL or description. An LLM turns it into an Opportunity with company, role, location, and status filled in — no manual data entry.",
    flagKey: null,
  },
  {
    icon: GitBranch,
    title: "Status pipeline",
    body: "Seven Status values from Saved through Accepted, with every transition recorded in Status History so you can retrace how a role moved.",
    flagKey: null,
  },
  {
    icon: Archive,
    title: "Archive",
    body: "Hide an Opportunity without deleting it. Orthogonal to Status, so a rejected role can stay rejected without cluttering your Active list.",
    flagKey: null,
  },
  {
    icon: ListChecks,
    title: "Active list",
    body: "Sort by any column, multi-select with shift-click, and run bulk actions across rows. Your whole search at a glance.",
    flagKey: null,
  },
  {
    icon: MessageSquareText,
    title: "Comments and timeline",
    body: "Rich-text comments and a chronological timeline on every Opportunity, so call notes and Status changes sit side by side.",
    flagKey: null,
  },
];
