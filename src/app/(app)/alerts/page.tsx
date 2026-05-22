import { notFound } from "next/navigation";
import { alertsFlag } from "@/lib/flags";

export default async function AlertsPage() {
  if (!(await alertsFlag())) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Alerts</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Alerts and notifications coming soon. This will let you know about
        deadlines and follow-ups in your job search.
      </p>
    </div>
  );
}
