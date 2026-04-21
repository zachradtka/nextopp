"use client";

import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import {
  archiveOpportunity,
  unarchiveOpportunity,
  deleteOpportunity,
} from "@/lib/actions/opportunities";

interface OpportunitySidebarActionsProps {
  id: string;
  archived: boolean;
}

export function OpportunitySidebarActions({
  id,
  archived,
}: OpportunitySidebarActionsProps) {
  const router = useRouter();

  const handleArchiveToggle = async () => {
    if (archived) {
      await unarchiveOpportunity(id);
    } else {
      await archiveOpportunity(id);
    }
    router.push("/opportunities");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    await deleteOpportunity(id);
    router.push("/opportunities");
  };

  return (
    <div className="border-t pt-6">
      <div className="-mx-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleArchiveToggle}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          {archived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
          {archived ? "Unarchive opportunity" : "Archive opportunity"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <Trash2 className="size-4" />
          Delete opportunity
        </button>
      </div>
    </div>
  );
}
