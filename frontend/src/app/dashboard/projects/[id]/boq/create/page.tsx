'use client';

import { useParams } from 'next/navigation';
import BOQForm from '@/components/boq/BOQForm';

export default function CreateBOQPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create BOQ</h1>
        <p className="text-muted-foreground">Create a new Bill of Quantities for this project</p>
      </div>

      <BOQForm projectId={projectId} />
    </div>
  );
}
