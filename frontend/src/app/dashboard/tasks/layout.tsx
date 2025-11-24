'use client';

import { Suspense } from 'react';
import { TaskProvider } from '@/contexts/TaskContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskProvider>
      <div className="h-full">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </div>
    </TaskProvider>
  );
}