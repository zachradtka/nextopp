import { CommentComposer } from "@/components/comment-composer";
import { TimelineComment } from "@/components/timeline-comment";
import {
  STATUS_LABELS,
  STATUS_DOT_COLORS,
  type Status,
} from "@/lib/constants";
import type { StatusHistory, OpportunityComment } from "@/lib/db/schema";

type TimelineEvent =
  | {
      kind: "status";
      id: string;
      timestamp: string;
      status: string;
      note: string | null;
    }
  | {
      kind: "comment";
      id: string;
      timestamp: string;
      body: string;
      createdAt: string;
      updatedAt: string;
    };

// On exact timestamp ties, structural events (status changes) render before
// reactive events (comments) — matches GitHub's timeline behavior.
const EVENT_PRIORITY: Record<TimelineEvent["kind"], number> = {
  status: 0,
  comment: 1,
};

function buildEvents(
  history: StatusHistory[],
  comments: OpportunityComment[]
): TimelineEvent[] {
  const statusEvents: TimelineEvent[] = history.map((entry) => ({
    kind: "status",
    id: entry.id,
    timestamp: entry.changedAt,
    status: entry.status,
    note: entry.note,
  }));

  const commentEvents: TimelineEvent[] = comments.map((entry) => ({
    kind: "comment",
    id: entry.id,
    timestamp: entry.createdAt,
    body: entry.body,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));

  return [...statusEvents, ...commentEvents].sort((a, b) => {
    const byTime = a.timestamp.localeCompare(b.timestamp);
    if (byTime !== 0) return byTime;
    return EVENT_PRIORITY[a.kind] - EVENT_PRIORITY[b.kind];
  });
}

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

function StatusEvent({
  status,
  timestamp,
  note,
}: {
  status: string;
  timestamp: string;
  note: string | null;
}) {
  const label = STATUS_LABELS[status as Status] ?? status;
  const dotColor = STATUS_DOT_COLORS[status as Status] ?? "bg-gray-400";

  return (
    <li className="relative pl-8">
      <span
        aria-hidden
        className={`absolute left-4 top-2 -translate-x-1/2 inline-block w-2 h-2 rounded-full ring-4 ring-background ${dotColor}`}
      />
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="text-muted-foreground">Marked as</span>
        <span className="font-medium text-foreground">{label}</span>
        <time
          dateTime={timestamp}
          title={formatAbsolute(timestamp)}
          className="text-xs text-muted-foreground"
        >
          {formatRelative(timestamp)}
        </time>
      </div>
      {note && (
        <p className="mt-1 text-sm text-foreground">{note}</p>
      )}
    </li>
  );
}

export function OpportunityTimeline({
  opportunityId,
  history,
  comments,
}: {
  opportunityId: string;
  history: StatusHistory[];
  comments: OpportunityComment[];
}) {
  const events = buildEvents(history, comments);

  return (
    <section aria-label="Activity">
      {events.length > 0 && (
        <div className="relative">
          <span
            aria-hidden
            className="absolute left-4 -top-6 bottom-2 -translate-x-1/2 w-px bg-border"
          />
          <ul className="space-y-5">
            {events.map((event) =>
              event.kind === "status" ? (
                <StatusEvent
                  key={`status-${event.id}`}
                  status={event.status}
                  timestamp={event.timestamp}
                  note={event.note}
                />
              ) : (
                <TimelineComment
                  key={`comment-${event.id}`}
                  id={event.id}
                  body={event.body}
                  createdAt={event.createdAt}
                  updatedAt={event.updatedAt}
                />
              )
            )}
          </ul>
        </div>
      )}
      <div className={events.length > 0 ? "mt-5" : ""}>
        <h3 className="text-base font-semibold mb-3">Add a comment</h3>
        <CommentComposer opportunityId={opportunityId} />
      </div>
    </section>
  );
}
