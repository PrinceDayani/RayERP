'use client';

import { Suspense, lazy, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const UserDashboard = lazy(() => import('@/components/admin/UserDashboard').then(m => ({ default: m.default })));

const DashboardLoader = memo(() => (
  <div className="space-y-4 p-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  </div>
));
DashboardLoader.displayName = 'DashboardLoader';

const DashboardError = memo(() => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold">Dashboard Unavailable</h2>
      <p className="text-muted-foreground">Please refresh the page.</p>
    </div>
  </div>
));
DashboardError.displayName = 'DashboardError';

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  if (loading) return <DashboardLoader />;
  if (!isAuthenticated || !user) return null;

  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <Suspense fallback={<DashboardLoader />}>
        <UserDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
