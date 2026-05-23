import type { ReactNode } from "react";

export function ScreenshotFrame({
  children,
  url,
}: {
  children?: ReactNode;
  url?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-yellow-500/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-green-500/70" aria-hidden />
        </div>
        {url ? (
          <div className="mx-auto rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            {url}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
