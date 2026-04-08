import * as z from "zod";
import { STATUSES, WORK_MODES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants";

export const opportunitySchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  url: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  status: z.enum(STATUSES).default("saved"),
  salaryMin: z
    .string()
    .or(z.number())
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return null;
      const cleaned = String(v).replace(/,/g, "");
      const num = Number(cleaned);
      return isNaN(num) ? v : num;
    })
    .pipe(z.number().int("Must be a whole number").min(0, "Must be a positive number").nullable()),
  salaryMax: z
    .string()
    .or(z.number())
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return null;
      const cleaned = String(v).replace(/,/g, "");
      const num = Number(cleaned);
      return isNaN(num) ? v : num;
    })
    .pipe(z.number().int("Must be a whole number").min(0, "Must be a positive number").nullable()),
  workMode: z
    .enum(WORK_MODES)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  location: z
    .string()
    .optional()
    .transform((v) => v || null),
  department: z
    .string()
    .optional()
    .transform((v) => v || null),
  employmentType: z
    .enum(EMPLOYMENT_TYPES)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  experienceLevel: z
    .enum(EXPERIENCE_LEVELS)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  jobId: z
    .string()
    .optional()
    .transform((v) => v || null),
  datePosted: z
    .string()
    .optional()
    .transform((v) => v || null),
  contactName: z
    .string()
    .optional()
    .transform((v) => v || null),
  jobDescription: z
    .string()
    .optional()
    .transform((v) => v || null),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
  appliedAt: z
    .string()
    .optional()
    .transform((v) => v || null),
  respondedAt: z
    .string()
    .optional()
    .transform((v) => v || null),
}).refine(
  (data) => {
    if (data.salaryMin != null && data.salaryMax != null) {
      return data.salaryMin <= data.salaryMax;
    }
    return true;
  },
  {
    message: "Salary min must be less than or equal to salary max",
    path: ["salaryMin"],
  }
);

// Schema without the cross-field refine, used for per-field validation
export const opportunityFieldSchemas = {
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  salaryMin: z.string().optional().transform((v) => {
    if (!v || v === "") return null;
    const cleaned = v.replace(/,/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? v : num;
  }).pipe(z.number().int("Must be a whole number").min(0, "Must be a positive number").nullable()),
  salaryMax: z.string().optional().transform((v) => {
    if (!v || v === "") return null;
    const cleaned = v.replace(/,/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? v : num;
  }).pipe(z.number().int("Must be a whole number").min(0, "Must be a positive number").nullable()),
} as const;

export type ValidatableField = keyof typeof opportunityFieldSchemas;

export function validateField(
  field: ValidatableField,
  value: string,
  formData?: { salaryMin?: string; salaryMax?: string }
): string | null {
  const schema = opportunityFieldSchemas[field];
  const result = schema.safeParse(value);

  if (!result.success) {
    return result.error.issues[0]?.message ?? "Invalid value";
  }

  // Cross-field: salary min ≤ max
  if ((field === "salaryMin" || field === "salaryMax") && formData) {
    const min = field === "salaryMin" ? value : formData.salaryMin;
    const max = field === "salaryMax" ? value : formData.salaryMax;
    if (min && max && Number(min) > Number(max)) {
      return field === "salaryMin"
        ? "Must be less than or equal to salary max"
        : "Must be greater than or equal to salary min";
    }
  }

  return null;
}

export type OpportunityFormData = z.infer<typeof opportunitySchema>;

export type OpportunityFormErrors = {
  [K in keyof OpportunityFormData]?: string[];
};

export type OpportunityFormState = {
  errors?: OpportunityFormErrors;
  message?: string;
};

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === null ? undefined : value;
}

export function parseFormData(formData: FormData) {
  return opportunitySchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
    url: getOptionalFormValue(formData, "url"),
    status: getOptionalFormValue(formData, "status"),
    salaryMin: getOptionalFormValue(formData, "salaryMin"),
    salaryMax: getOptionalFormValue(formData, "salaryMax"),
    workMode: getOptionalFormValue(formData, "workMode"),
    location: getOptionalFormValue(formData, "location"),
    department: getOptionalFormValue(formData, "department"),
    employmentType: getOptionalFormValue(formData, "employmentType"),
    experienceLevel: getOptionalFormValue(formData, "experienceLevel"),
    jobId: getOptionalFormValue(formData, "jobId"),
    datePosted: getOptionalFormValue(formData, "datePosted"),
    contactName: getOptionalFormValue(formData, "contactName"),
    jobDescription: getOptionalFormValue(formData, "jobDescription"),
    notes: getOptionalFormValue(formData, "notes"),
    appliedAt: getOptionalFormValue(formData, "appliedAt"),
    respondedAt: getOptionalFormValue(formData, "respondedAt"),
  });
}
