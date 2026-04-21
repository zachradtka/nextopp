import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityForm } from "@/components/opportunity-form";
import { getOpportunity } from "@/lib/actions/opportunities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOpportunityPage({ params }: PageProps) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/opportunities" className="hover:text-foreground">
          Opportunities
        </Link>
        <span className="mx-1.5">&rsaquo;</span>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="hover:text-foreground"
        >
          {opportunity.company}
        </Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-foreground font-medium">Edit</span>
      </nav>
      <h1 className="text-2xl font-bold">
        Edit: {opportunity.company} — {opportunity.role}
      </h1>
      <OpportunityForm
        opportunity={opportunity}
        aiEnabled={false}
        urlAutofillEnabled={false}
        textAutofillEnabled={false}
      />
    </div>
  );
}
