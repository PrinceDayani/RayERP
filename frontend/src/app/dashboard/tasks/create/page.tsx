'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TaskEditor } from '@/components/tasks';

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  return (
    <div className="container mx-auto p-6">
      <TaskEditor
        projectId={projectId || undefined}
        onSave={(task) => {
          router.push(`/dashboard/tasks/${task._id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
