'use client';

import { Suspense, lazy, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const UserDashboard = lazy(() => import('@/components/admin/UserDashboard').then(m => ({ default: m.default })));

// Loading component for the dashboard - Memoized
const DashboardLoader = memo(() => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner 
      size="lg" 
      text="Loading dashboard..." 
      variant="default"
    />
  </div>
));
DashboardLoader.displayName = 'DashboardLoader';

// Error fallback for dashboard - Memoized
const DashboardError = memo(() => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Dashboard Unavailable</h2>
      <p className="text-muted-foreground">
        Having trouble loading dashboard. Please refresh.
      </p>
    </div>
  </div>
));
DashboardError.displayName = 'DashboardError';

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <DashboardLoader />;
  if (!isAuthenticated || !user) return null;

  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Role: {typeof user.role === 'string' ? user.role : user.role?.name || 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <Suspense fallback={<DashboardLoader />}>
          <UserDashboard />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}