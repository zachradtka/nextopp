import * as z from "zod";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORK_MODES,
} from "@/lib/constants";

function optionalTrimmedString() {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().min(1).optional());
}

function optionalIsoDateString() {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    if (trimmed === "") {
      return undefined;
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }

    return parsed.toISOString().slice(0, 10);
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());
}

export const parsedJobPostingSchema = z.object({
  company: optionalTrimmedString(),
  role: optionalTrimmedString(),
  url: z.string().url().optional(),
  workMode: z.enum(WORK_MODES).optional(),
  location: optionalTrimmedString(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  department: optionalTrimmedString(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  jobId: optionalTrimmedString(),
  datePosted: optionalIsoDateString(),
  contactName: optionalTrimmedString(),
  jobDescription: optionalTrimmedString(),
});

export type ParsedJobPosting = z.infer<typeof parsedJobPostingSchema>;
export const parsedJobPostingJsonSchema = z.toJSONSchema(parsedJobPostingSchema);
