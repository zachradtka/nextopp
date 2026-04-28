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
import { cn } from "@/lib/utils";
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
import { parseJobPosting, type ParseJobPostingErrorCode } from "@/lib/actions/parse-job-posting";
import type { ParsedJobPosting } from "@/lib/validations/parse-job-posting";

const AI_STATUS_MESSAGES = [
  "Reading the posting...",
  "Hunting for the company...",
  "Spotting the salary...",
  "Decoding recruiter-speak...",
  "Untangling the role...",
  "Asking the AI nicely...",
];

function validateAiUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Enter a valid URL (including https://).";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "URL must start with http:// or https://.";
  }
  return null;
}

function countAppliedFields(parsed: ParsedJobPosting): number {
  let count = 0;
  for (const [key, value] of Object.entries(parsed)) {
    if (value == null) continue;
    if (key === "url") continue;
    if (typeof value === "string" && value.trim().length === 0) continue;
    count += 1;
  }
  return count;
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

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
  const [aiErrorCode, setAiErrorCode] = useState<ParseJobPostingErrorCode | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [aiStatusIndex, setAiStatusIndex] = useState(0);

  useEffect(() => {
    if (!isParsing) return;
    setAiStatusIndex(Math.floor(Math.random() * AI_STATUS_MESSAGES.length));
    const id = window.setInterval(() => {
      setAiStatusIndex((i) => (i + 1) % AI_STATUS_MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [isParsing]);

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
      router.push("/opportunities");
    }
  }, [createState, isEditing, router]);

  useEffect(() => {
    if (isEditing && "id" in updateState && updateState.id && !updateState.errors) {
      router.push(`/opportunities/${opportunity!.id}`);
    }
  }, [updateState, isEditing, opportunity, router]);

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

  const handleAiInputChange = useCallback(
    (next: string) => {
      setAiInputValue(next);
      setAiError(null);
      setAiErrorCode(null);
      setAiSuccess(null);
      if (urlError && aiInputMode === "url") {
        setUrlError(validateAiUrl(next));
      }
    },
    [aiInputMode, urlError]
  );

  const handleAiUrlBlur = useCallback(() => {
    if (aiInputMode === "url") {
      setUrlError(validateAiUrl(aiInputValue));
    }
  }, [aiInputMode, aiInputValue]);

  const switchAiMode = useCallback(
    (next: "url" | "text") => {
      if (next === aiInputMode) return;
      setAiInputMode(next);
      setAiInputValue("");
      setAiError(null);
      setAiErrorCode(null);
      setAiSuccess(null);
      setUrlError(null);
    },
    [aiInputMode]
  );

  const handleAutoFill = useCallback(() => {
    setAiError(null);
    setAiErrorCode(null);
    setAiSuccess(null);

    if (aiInputMode === "url") {
      const validationError = validateAiUrl(aiInputValue);
      if (validationError) {
        setUrlError(validationError);
        return;
      }
    }

    startParsing(async () => {
      const result = await parseJobPosting({
        sourceType: aiInputMode,
        value: aiInputValue,
      });

      if (result.error) {
        setAiError(result.error);
        setAiErrorCode(result.code);
        return;
      }

      if (!result.data) {
        setAiError("Couldn't parse that posting right now. Please try again.");
        setAiErrorCode("ai_provider_error");
        return;
      }

      const filled = countAppliedFields(result.data);
      applyParsedValues(result.data);
      setAiSuccess(
        filled > 0
          ? `Filled ${filled} field${filled === 1 ? "" : "s"} from the posting — review them below.`
          : "Auto-fill finished, but no fields could be populated."
      );
    });
  }, [aiInputMode, aiInputValue, applyParsedValues]);

  const autoFillDisabled =
    isParsing ||
    !aiInputValue.trim() ||
    (aiInputMode === "url" && urlError !== null);

  const submitDisabled =
    pending || !values.company.trim() || !values.role.trim();

  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key !== "Enter" || e.shiftKey || !(e.metaKey || e.ctrlKey)) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const inAiPanel =
        target instanceof HTMLElement &&
        (target.id === "ai-url" || target.id === "ai-text");

      if (inAiPanel) {
        if (aiEnabled && !isEditing && !autoFillDisabled) {
          e.preventDefault();
          handleAutoFill();
        }
        return;
      }

      if (submitDisabled || isParsing) return;
      e.preventDefault();
      formRef.current?.requestSubmit();
    },
    [
      aiEnabled,
      autoFillDisabled,
      handleAutoFill,
      isEditing,
      isParsing,
      submitDisabled,
    ]
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      onKeyDown={handleFormKeyDown}
      className="space-y-6 max-w-2xl"
    >
      {state.message && state.errors && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {aiEnabled && !isEditing && (
        <div className="overflow-hidden rounded-md border border-border/70 bg-muted/40">
          {urlAutofillEnabled && textAutofillEnabled && (
            <div
              role="tablist"
              aria-label="Auto-fill source"
              className="flex border-b border-border/70 bg-muted/30 px-2"
            >
              <TabButton
                active={aiInputMode === "url"}
                onClick={() => switchAiMode("url")}
                disabled={isParsing}
              >
                URL
              </TabButton>
              <TabButton
                active={aiInputMode === "text"}
                onClick={() => switchAiMode("text")}
                disabled={isParsing}
              >
                Text
              </TabButton>
            </div>
          )}

          <div className="space-y-3 p-3 sm:p-4">
          {aiInputMode === "url" && urlAutofillEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="ai-url">Job Posting URL</Label>
              <Input
                id="ai-url"
                type="url"
                value={aiInputValue}
                onChange={(e) => handleAiInputChange(e.target.value)}
                onBlur={handleAiUrlBlur}
                placeholder="https://..."
                disabled={isParsing}
                aria-invalid={urlError !== null}
                aria-describedby={urlError ? "ai-url-error" : undefined}
              />
              {urlError && (
                <p id="ai-url-error" className="text-sm text-destructive">
                  {urlError}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ai-text">Job Description Text</Label>
              <Textarea
                id="ai-text"
                rows={8}
                value={aiInputValue}
                onChange={(e) => handleAiInputChange(e.target.value)}
                placeholder="Paste the job posting text here..."
                className="resize-y"
                disabled={isParsing}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {isParsing ? AI_STATUS_MESSAGES[aiStatusIndex] : ""}
            </span>
            <Button type="button" onClick={handleAutoFill} disabled={autoFillDisabled}>
              {isParsing && <LoaderCircle className="animate-spin" />}
              {isParsing ? "Auto-filling..." : "Auto-fill with AI"}
            </Button>
          </div>

          {aiSuccess && !aiError && (
            <p className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">
              {aiSuccess}
            </p>
          )}

          {aiError && (
            <div className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <p>{aiError}</p>
              {aiInputMode === "url" &&
                textAutofillEnabled &&
                (aiErrorCode === "url_unreachable" ||
                  aiErrorCode === "url_blocked" ||
                  aiErrorCode === "timeout") && (
                  <button
                    type="button"
                    onClick={() => switchAiMode("text")}
                    className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
                  >
                    Switch to pasting the description text
                  </button>
                )}
            </div>
          )}
          </div>
        </div>
      )}

      <fieldset
        disabled={isParsing}
        aria-busy={isParsing}
        className="m-0 space-y-6 border-0 p-0 disabled:opacity-60"
      >
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
        <Button type="submit" disabled={submitDisabled}>
          {pending ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save" : "Create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
      </fieldset>
    </form>
  );
}
