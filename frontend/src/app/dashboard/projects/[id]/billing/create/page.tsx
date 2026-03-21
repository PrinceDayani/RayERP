'use client';

import { useParams } from 'next/navigation';
import BillingForm from '@/components/billing/BillingForm';

export default function CreateBillingPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Milestone Billing</h1>
        <p className="text-muted-foreground">Create a new milestone billing for this project</p>
      </div>

      <BillingForm projectId={projectId} />
    </div>
  );
}
