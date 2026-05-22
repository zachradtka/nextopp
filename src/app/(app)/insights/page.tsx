import { notFound } from "next/navigation";
import { insightsFlag } from "@/lib/flags";

export default async function InsightsPage() {
  if (!(await insightsFlag())) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Insights</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Insights and analytics coming soon. This will help you understand
        patterns in your job search.
      </p>
    </div>
  );
}
