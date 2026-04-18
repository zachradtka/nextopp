"use client";

import {
  useActionState,
  useEffect,
  useState,
  useCallback,
  useRef,
  useTransition,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUSES,
  STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants";
import { createOpportunity, updateOpportunity } from "@/lib/actions/opportunities";
import type { Opportunity } from "@/lib/db/schema";
import {
  validateField,
  type OpportunityFormState,
  type ValidatableField,
} from "@/lib/validations/opportunity";
import { parseJobPosting } from "@/lib/actions/parse-job-posting";
import type { ParsedJobPosting } from "@/lib/validations/parse-job-posting";

interface OpportunityFormProps {
  opportunity?: Opportunity;
  aiEnabled?: boolean;
  urlAutofillEnabled?: boolean;
  textAutofillEnabled?: boolean;
}

export function OpportunityForm({
  opportunity,
  aiEnabled = false,
  urlAutofillEnabled = false,
  textAutofillEnabled = false,
}: OpportunityFormProps) {
  const router = useRouter();
  const isEditing = !!opportunity;
  const formRef = useRef<HTMLFormElement>(null);
  const [isParsing, startParsing] = useTransition();

  // Controlled form values
  const [values, setValues] = useState({
    company: opportunity?.company ?? "",
    role: opportunity?.role ?? "",
    department: opportunity?.department ?? "",
    jobId: opportunity?.jobId ?? "",
    status: opportunity?.status ?? "saved",
    employmentType: opportunity?.employmentType ?? "",
    experienceLevel: opportunity?.experienceLevel ?? "",
    workMode: opportunity?.workMode ?? "",
    location: opportunity?.location ?? "",
    url: opportunity?.url ?? "",
    salaryMin: opportunity?.salaryMin != null ? String(opportunity.salaryMin) : "",
    salaryMax: opportunity?.salaryMax != null ? String(opportunity.salaryMax) : "",
    contactName: opportunity?.contactName ?? "",
    datePosted: opportunity?.datePosted ?? "",
    appliedAt: opportunity?.appliedAt ?? "",
    respondedAt: opportunity?.respondedAt ?? "",
    jobDescription: opportunity?.jobDescription ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [aiInputMode, setAiInputMode] = useState<"url" | "text">(
    urlAutofillEnabled ? "url" : "text"
  );
  const [aiInputValue, setAiInputValue] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  const boundUpdateAction = opportunity
    ? updateOpportunity.bind(null, opportunity.id)
    : undefined;

  const [createState, createAction, createPending] = useActionState(
    createOpportunity,
    {} as OpportunityFormState
  );

  const [updateState, updateAction, updatePending] = useActionState(
    boundUpdateAction ?? createOpportunity,
    {} as OpportunityFormState
  );

  const state = isEditing ? updateState : createState;
  const formAction = isEditing ? updateAction : createAction;
  const pending = isEditing ? updatePending : createPending;

  const serverFieldErrors = useMemo(() => {
    const next: Record<string, string | null> = {};

    if (!state.errors) {
      return next;
    }

    for (const [key, messages] of Object.entries(state.errors)) {
      if (messages && messages.length > 0) {
        next[key] = messages[0];
      }
    }

    return next;
  }, [state.errors]);

  // Navigate on success
  useEffect(() => {
    if (!isEditing && "id" in createState && createState.id && !createState.errors) {
      router.push("/");
    }
  }, [createState, isEditing, router]);

  useEffect(() => {
    if (isEditing && updateState && !updateState.errors && !updatePending && Object.keys(updateState).length > 0 && !updateState.message) {
      router.push(`/opportunities/${opportunity!.id}`);
    }
  }, [updateState, isEditing, updatePending, opportunity, router]);

  const handleChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (field: string) => (value: string | null) => {
      setValues((prev) => ({ ...prev, [field]: value ?? "" }));
    },
    []
  );

  const handleBlur = useCallback(
    (field: ValidatableField) => (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const salaryData = {
        salaryMin: values.salaryMin,
        salaryMax: values.salaryMax,
      };

      const error = validateField(field, value, salaryData);
      setFieldErrors((prev) => {
        const next = { ...prev, [field]: error };
        // Also clear/revalidate the other salary field when one changes
        if (field === "salaryMin" || field === "salaryMax") {
          const otherField = field === "salaryMin" ? "salaryMax" : "salaryMin";
          const otherValue = field === "salaryMin" ? values.salaryMax : values.salaryMin;
          if (otherValue) {
            next[otherField] = validateField(otherField, otherValue, {
              salaryMin: field === "salaryMin" ? value : values.salaryMin,
              salaryMax: field === "salaryMax" ? value : values.salaryMax,
            });
          }
        }
        return next;
      });
    },
    [values.salaryMin, values.salaryMax]
  );

  const getError = (field: string): string | null => {
    return fieldErrors[field] ?? serverFieldErrors[field] ?? null;
  };

  const applyParsedValues = useCallback((parsed: ParsedJobPosting) => {
    setValues((prev) => ({
      ...prev,
      company: parsed.company ?? "",
      role: parsed.role ?? "",
      department: parsed.department ?? "",
      jobId: parsed.jobId ?? "",
      employmentType: parsed.employmentType ?? "",
      experienceLevel: parsed.experienceLevel ?? "",
      workMode: parsed.workMode ?? "",
      location: parsed.location ?? "",
      url: parsed.url ?? "",
      salaryMin: parsed.salaryMin != null ? String(parsed.salaryMin) : "",
      salaryMax: parsed.salaryMax != null ? String(parsed.salaryMax) : "",
      contactName: parsed.contactName ?? "",
      datePosted: parsed.datePosted ?? "",
      jobDescription: parsed.jobDescription ?? "",
    }));
  }, []);

  const handleAutoFill = useCallback(() => {
    setAiError(null);

    startParsing(async () => {
      const result = await parseJobPosting({
        sourceType: aiInputMode,
        value: aiInputValue,
      });

      if (result.error) {
        setAiError(result.error);
        return;
      }

      if (!result.data) {
        setAiError("Couldn't parse that posting right now. Please try again.");
        return;
      }

      applyParsedValues(result.data);
    });
  }, [aiInputMode, aiInputValue, applyParsedValues]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6 max-w-2xl">
      {state.message && state.errors && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {aiEnabled && !isEditing && (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Paste a posting to auto-fill with AI</h2>
            <p className="text-sm text-muted-foreground">
              {urlAutofillEnabled && textAutofillEnabled
                ? "Drop in a job URL or paste the description text, then review the suggested fields before saving."
                : urlAutofillEnabled
                  ? "Drop in a job URL and we&apos;ll scrape the posting to suggest form values."
                  : "Paste the description text, then review the suggested fields before saving."}
            </p>
          </div>

          {aiInputMode === "url" && urlAutofillEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="ai-url">Job Posting URL</Label>
              <Input
                id="ai-url"
                value={aiInputValue}
                onChange={(e) => setAiInputValue(e.target.value)}
                placeholder="https://..."
                disabled={isParsing}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ai-text">Job Description Text</Label>
              <Textarea
                id="ai-text"
                rows={8}
                value={aiInputValue}
                onChange={(e) => setAiInputValue(e.target.value)}
                placeholder="Paste the job posting text here..."
                className="resize-y"
                disabled={isParsing}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {urlAutofillEnabled && textAutofillEnabled ? (
              <button
                type="button"
                className="w-fit text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setAiError(null);
                  setAiInputValue("");
                  setAiInputMode((prev) => (prev === "url" ? "text" : "url"));
                }}
              >
                {aiInputMode === "url"
                  ? "Or paste job description text"
                  : "Or switch back to a job posting URL"}
              </button>
            ) : (
              <div />
            )}
            <Button type="button" onClick={handleAutoFill} disabled={isParsing}>
              {isParsing && <LoaderCircle className="animate-spin" />}
              {isParsing ? "Auto-filling..." : "Auto-fill"}
            </Button>
          </div>

          {aiError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {aiError}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            name="company"
            value={values.company}
            onChange={handleChange("company")}
            placeholder="Acme Corp"
            onBlur={handleBlur("company")}
          />
          {getError("company") && (
            <p className="text-sm text-destructive">{getError("company")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            name="role"
            value={values.role}
            onChange={handleChange("role")}
            placeholder="Senior Software Engineer"
            onBlur={handleBlur("role")}
          />
          {getError("role") && (
            <p className="text-sm text-destructive">{getError("role")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department / Team</Label>
          <Input
            id="department"
            name="department"
            value={values.department}
            onChange={handleChange("department")}
            placeholder="Engineering"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobId">Job ID / Req Number</Label>
          <Input
            id="jobId"
            name="jobId"
            value={values.jobId}
            onChange={handleChange("jobId")}
            placeholder="REQ-12345"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={values.status} onValueChange={handleSelectChange("status")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select name="employmentType" value={values.employmentType} onValueChange={handleSelectChange("employmentType")}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((et) => (
                <SelectItem key={et} value={et}>
                  {EMPLOYMENT_TYPE_LABELS[et]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select name="experienceLevel" value={values.experienceLevel} onValueChange={handleSelectChange("experienceLevel")}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((el) => (
                <SelectItem key={el} value={el}>
                  {EXPERIENCE_LEVEL_LABELS[el]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workMode">Work Mode</Label>
          <Select name="workMode" value={values.workMode} onValueChange={handleSelectChange("workMode")}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {WORK_MODES.map((wm) => (
                <SelectItem key={wm} value={wm}>
                  {WORK_MODE_LABELS[wm]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={values.location}
          onChange={handleChange("location")}
          placeholder="Austin, TX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Job Posting URL</Label>
        <Input
          id="url"
          name="url"
          value={values.url}
          onChange={handleChange("url")}
          placeholder="https://..."
          onBlur={handleBlur("url")}
        />
        {getError("url") && (
          <p className="text-sm text-destructive">{getError("url")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">Salary Min</Label>
          <Input
            id="salaryMin"
            name="salaryMin"
            inputMode="numeric"
            value={values.salaryMin}
            onChange={handleChange("salaryMin")}
            placeholder="80000"
            onBlur={handleBlur("salaryMin")}
          />
          {getError("salaryMin") && (
            <p className="text-sm text-destructive">{getError("salaryMin")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryMax">Salary Max</Label>
          <Input
            id="salaryMax"
            name="salaryMax"
            inputMode="numeric"
            value={values.salaryMax}
            onChange={handleChange("salaryMax")}
            placeholder="120000"
            onBlur={handleBlur("salaryMax")}
          />
          {getError("salaryMax") && (
            <p className="text-sm text-destructive">{getError("salaryMax")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactName">Contact / Recruiter</Label>
        <Input
          id="contactName"
          name="contactName"
          value={values.contactName}
          onChange={handleChange("contactName")}
          placeholder="Jane Smith"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="datePosted">Date Posted</Label>
          <Input
            id="datePosted"
            name="datePosted"
            type="date"
            value={values.datePosted}
            onChange={handleChange("datePosted")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appliedAt">Date Applied</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            value={values.appliedAt}
            onChange={handleChange("appliedAt")}
          />
        </div>
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="respondedAt">Date Responded</Label>
            <Input
              id="respondedAt"
              name="respondedAt"
              type="date"
              value={values.respondedAt}
              onChange={handleChange("respondedAt")}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea
          id="jobDescription"
          name="jobDescription"
          rows={8}
          value={values.jobDescription}
          onChange={handleChange("jobDescription")}
          placeholder="Paste the full job posting here (description, responsibilities, requirements)..."
          className="resize-y"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || !values.company.trim() || !values.role.trim()}>
          {pending ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save" : "Create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
