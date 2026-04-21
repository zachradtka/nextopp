"use client";

import { useState } from "react";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { CommentEditor } from "@/components/comment-editor";
import {
  CommentActionsMenu,
  type CommentAction,
} from "@/components/comment-actions-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateComment, deleteComment } from "@/lib/actions/opportunities";

function formatAbsolute(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelative(timestamp: string) {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(months / 12);
  return `${years}y ago`;
}

interface TimelineCommentProps {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export function TimelineComment({
  id,
  body,
  createdAt,
  updatedAt,
}: TimelineCommentProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const edited = updatedAt !== createdAt;

  const actions: CommentAction[] = [
    {
      label: "Edit",
      icon: Pencil,
      onSelect: () => setMode("edit"),
    },
    {
      label: "Delete",
      icon: Trash2,
      onSelect: () => setConfirmDeleteOpen(true),
      destructive: true,
    },
  ];

  async function handleSave(newBody: string) {
    await updateComment(id, newBody);
    setMode("view");
  }

  return (
    <li className="relative pl-8">
      <span
        aria-hidden
        className="absolute left-4 top-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground ring-4 ring-background"
      >
        <MessageSquare className="h-3 w-3" />
      </span>
      <div className="rounded-lg border bg-card">
        <header className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-baseline gap-1.5">
            <time
              dateTime={createdAt}
              title={formatAbsolute(createdAt)}
              className="text-xs text-muted-foreground"
            >
              commented {formatRelative(createdAt)}
            </time>
            {edited && (
              <span
                title={`Edited ${formatAbsolute(updatedAt)}`}
                className="text-xs text-muted-foreground"
              >
                (edited)
              </span>
            )}
          </div>
          {mode === "view" && <CommentActionsMenu actions={actions} />}
        </header>
        <div className="px-4 py-3">
          {mode === "edit" ? (
            <CommentEditor
              initialBody={body}
              onSave={handleSave}
              onCancel={() => setMode("view")}
            />
          ) : (
            <Markdown>{body}</Markdown>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete comment"
        description="Are you sure you'd like to delete this comment?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => deleteComment(id)}
      />
    </li>
  );
}
