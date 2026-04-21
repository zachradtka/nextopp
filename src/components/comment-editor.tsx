"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentEditorProps {
  initialBody: string;
  onSave: (body: string) => Promise<void>;
  onCancel: () => void;
}

export function CommentEditor({
  initialBody,
  onSave,
  onCancel,
}: CommentEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const trimmed = body.trim();
  const busy = isPending || saved;
  const canSave =
    trimmed.length > 0 && trimmed !== initialBody.trim() && !busy;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    startTransition(async () => {
      try {
        await onSave(trimmed);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update comment");
      }
    });
  }

  return (
    <div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        disabled={busy}
        className="resize-y"
        autoFocus
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={!canSave}>
          {busy ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
