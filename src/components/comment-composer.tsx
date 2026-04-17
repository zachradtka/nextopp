"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/lib/actions/opportunities";

export function CommentComposer({ opportunityId }: { opportunityId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await addComment(opportunityId, trimmed);
        setBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add comment");
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Leave a comment. Markdown supported."
          disabled={isPending}
          className="resize-y"
        />
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>
      <footer className="flex items-center justify-end border-t px-4 py-2">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? "Commenting..." : "Comment"}
        </Button>
      </footer>
    </div>
  );
}
