import type { ReactNode } from "react";

export function ScreenshotFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {children}
    </div>
  );
}
