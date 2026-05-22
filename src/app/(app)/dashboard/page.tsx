import { notFound } from "next/navigation";
import { dashboardFlag } from "@/lib/flags";

export default async function DashboardPage() {
  if (!(await dashboardFlag())) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Dashboard</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Dashboard overview coming soon. This will show a summary of your job
        search activity.
      </p>
    </div>
  );
}
