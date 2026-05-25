import { ScreenshotFrame } from "./ScreenshotFrame";

export function CaptureShowcase() {
  return (
    <section className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
      <div className="order-2 lg:order-1">
        <ScreenshotFrame>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture>
            <source
              srcSet="/marketing/capture-flow.png"
              media="(min-width: 640px)"
            />
            <img
              src="/marketing/capture-flow-mobile.png"
              alt="The NextOpp Capture form with a pasted job URL ready to auto-fill"
              width={390}
              height={844}
              className="block h-auto w-full"
            />
          </picture>
        </ScreenshotFrame>
      </div>
      <div className="order-1 lg:order-2">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Paste a link. Skip the form.
        </h2>
        <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
          Drop in a job posting URL or the description text you copied from a
          recruiter email. NextOpp&apos;s AI pulls out the company, role,
          location, and posting details, then drops you on a pre-filled
          Opportunity ready to tweak and save.
        </p>
      </div>
    </section>
  );
}
