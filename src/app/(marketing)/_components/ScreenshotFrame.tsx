import type { ReactNode } from "react";

export function ScreenshotFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-500/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-yellow-500/70" aria-hidden />
        <span className="size-2.5 rounded-full bg-green-500/70" aria-hidden />
      </div>
      {children}
    </div>
  );
}
