import Link from "next/link";
import { Briefcase } from "lucide-react";
import { SignInButton } from "./sign-in-button";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dark flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold sm:text-base"
          >
            <Briefcase className="size-5 shrink-0 text-primary sm:size-6" />
            <span>NextOpp</span>
          </Link>
          <SignInButton />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-3 sm:px-6 lg:px-8">
          <nav aria-label="Product" className="flex flex-col gap-2">
            {/* Slot reserved for future product links (e.g. /pricing, /changelog). */}
          </nav>
          <nav aria-label="Resources" className="flex flex-col gap-2">
            {/* Slot reserved for future resource links (e.g. /docs, /about). */}
          </nav>
          <div className="flex items-start sm:justify-end">
            <a
              href="https://github.com/zachradtka/nextopp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
