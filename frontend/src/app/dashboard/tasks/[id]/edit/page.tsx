'use client';

import { useParams, useRouter } from 'next/navigation';
import { TaskEditor } from '@/components/tasks';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  return (
    <div className="container mx-auto p-6">
      <TaskEditor
        taskId={taskId}
        onSave={(task) => {
          router.push(`/dashboard/tasks/${task._id}`);
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}