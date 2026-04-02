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
      <h1 className="text-2xl font-bold">
        Edit: {opportunity.company} — {opportunity.role}
      </h1>
      <OpportunityForm opportunity={opportunity} />
    </div>
  );
}
