"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/markdown-editor";
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
    <>
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="Use Markdown to format your comment"
        disabled={isPending}
        onSubmit={handleSubmit}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex items-center justify-end">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? "Commenting..." : "Comment"}
        </Button>
      </div>
    </>
  );
}
