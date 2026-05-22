import { notFound } from "next/navigation";
import { settingsFlag } from "@/lib/flags";

export default async function SettingsPage() {
  if (!(await settingsFlag())) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Settings</h1>
      <p className="text-sm font-medium text-muted-foreground">
        Settings coming soon. This will let you configure your account and
        preferences.
      </p>
    </div>
  );
}
