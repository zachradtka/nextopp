import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScreenshotFrame } from "./ScreenshotFrame";

export function Hero() {
  return (
    <section className="flex flex-col items-center pt-16 sm:pt-24 lg:pt-32">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Track your job search without the data entry
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Paste a job link or description. NextOpp&apos;s AI turns it into an
          Opportunity — company, role, location, status — so you can spend your
          time interviewing, not filling in fields.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button size="lg" className="h-11 px-6 text-base">
              Get started
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 w-full sm:mt-16 lg:mt-20">
        <ScreenshotFrame>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture>
            <source
              srcSet="/marketing/active-list.png"
              media="(min-width: 640px)"
            />
            <img
              src="/marketing/active-list-mobile.png"
              alt="The NextOpp active list, showing tracked opportunities across statuses"
              width={390}
              height={844}
              className="block h-auto w-full"
            />
          </picture>
        </ScreenshotFrame>
      </div>
    </section>
  );
}
