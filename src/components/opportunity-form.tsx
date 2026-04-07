"use client";

import { useActionState, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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

interface OpportunityFormProps {
  opportunity?: Opportunity;
}

export function OpportunityForm({ opportunity }: OpportunityFormProps) {
  const router = useRouter();
  const isEditing = !!opportunity;
  const formRef = useRef<HTMLFormElement>(null);

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
    notes: opportunity?.notes ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

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

  // Merge server errors into field errors when they come back
  useEffect(() => {
    if (state.errors) {
      const serverErrors: Record<string, string | null> = {};
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages && messages.length > 0) {
          serverErrors[key] = messages[0];
        }
      }
      setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
    }
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
    return fieldErrors[field] ?? null;
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6 max-w-2xl">
      {state.message && state.errors && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
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

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          value={values.notes}
          onChange={handleChange("notes")}
          placeholder="Interview notes, contacts, etc."
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
