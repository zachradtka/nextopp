"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  archiveOpportunity,
  deleteOpportunity,
} from "@/lib/actions/opportunities";

export function OpportunityActions({ id }: { id: string }) {
  const router = useRouter();

  const handleArchive = async () => {
    await archiveOpportunity(id);
    router.push("/");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    await deleteOpportunity(id);
    router.push("/");
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/opportunities/${id}/edit`}>
        <Button>Edit</Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" aria-label="More actions" />}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive}>Archive</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
