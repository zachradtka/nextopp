import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col items-center py-16 text-center sm:py-24 lg:py-32">
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        A central place for your entire interviewing journey
      </h1>
      <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
        Track applications, manage your interview pipeline, and capture every
        conversation along the way — all in one place.
      </p>
      <div className="mt-8">
        <Link href="/login">
          <Button size="lg" className="h-11 px-6 text-base">
            Get started
          </Button>
        </Link>
      </div>
    </section>
  );
}
