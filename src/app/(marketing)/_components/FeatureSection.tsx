import type { LandingFeature } from "../_lib/landing-features";

export function FeatureSection({ features }: { features: LandingFeature[] }) {
  if (features.length === 0) return null;

  return (
    <section className="grid gap-6 pb-16 sm:gap-8 sm:pb-24 md:grid-cols-3 lg:pb-32">
      {features.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="flex flex-col rounded-xl border border-border bg-card p-6 text-card-foreground"
        >
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
      ))}
    </section>
  );
}
