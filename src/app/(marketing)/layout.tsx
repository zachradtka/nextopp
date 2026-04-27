import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold sm:text-base"
          >
            <Briefcase className="size-5 shrink-0 text-primary sm:size-6" />
            <span>Opportunity Tracker</span>
          </Link>
          <Link href="/api/auth/signin">
            <Button size="sm" className="sm:h-8 sm:px-3">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>Opportunity Tracker — open source</span>
          <a
            href="https://github.com/zachradtka/opportunity-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            View on GitHub
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
