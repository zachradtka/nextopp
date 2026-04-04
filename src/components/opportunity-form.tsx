"use client";

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
import { STATUSES, STATUS_LABELS, WORK_MODES, WORK_MODE_LABELS } from "@/lib/constants";
import { createOpportunity, updateOpportunity } from "@/lib/actions/opportunities";
import type { Opportunity } from "@/lib/db/schema";

interface OpportunityFormProps {
  opportunity?: Opportunity;
}

export function OpportunityForm({ opportunity }: OpportunityFormProps) {
  const router = useRouter();
  const isEditing = !!opportunity;

  async function handleSubmit(formData: FormData) {
    if (isEditing) {
      await updateOpportunity(opportunity.id, formData);
      router.push(`/opportunities/${opportunity.id}`);
    } else {
      const { id } = await createOpportunity(formData);
      router.push("/");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            name="company"
            required
            defaultValue={opportunity?.company}
            placeholder="Acme Corp"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            name="role"
            required
            defaultValue={opportunity?.role}
            placeholder="Senior Software Engineer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={opportunity?.status ?? "saved"}>
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
          <Label htmlFor="workMode">Work Mode</Label>
          <Select name="workMode" defaultValue={opportunity?.workMode ?? ""}>
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
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={opportunity?.location ?? ""}
            placeholder="Austin, TX"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Job Posting URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          defaultValue={opportunity?.url ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">Salary Min</Label>
          <Input
            id="salaryMin"
            name="salaryMin"
            type="number"
            defaultValue={opportunity?.salaryMin ?? ""}
            placeholder="80000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryMax">Salary Max</Label>
          <Input
            id="salaryMax"
            name="salaryMax"
            type="number"
            defaultValue={opportunity?.salaryMax ?? ""}
            placeholder="120000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appliedAt">Date Applied</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={opportunity?.appliedAt ?? ""}
          />
        </div>
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="respondedAt">Date Responded</Label>
            <Input
              id="respondedAt"
              name="respondedAt"
              type="date"
              defaultValue={opportunity?.respondedAt ?? ""}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={opportunity?.notes ?? ""}
          placeholder="Interview notes, contacts, etc."
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit">{isEditing ? "Update" : "Create"} Opportunity</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
