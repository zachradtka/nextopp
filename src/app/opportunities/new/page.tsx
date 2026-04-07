import Link from "next/link";
import { OpportunityForm } from "@/components/opportunity-form";

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <span>Portfolio</span>
        <span className="mx-1.5">&rsaquo;</span>
        <Link href="/" className="hover:text-foreground">
          Applications
        </Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-foreground font-medium">Create Opportunity</span>
      </nav>
      <h1 className="text-2xl font-bold">Create Opportunity</h1>
      <OpportunityForm />
    </div>
  );
}
