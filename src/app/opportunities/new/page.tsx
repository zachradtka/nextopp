import { OpportunityForm } from "@/components/opportunity-form";

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Opportunity</h1>
      <OpportunityForm />
    </div>
  );
}
