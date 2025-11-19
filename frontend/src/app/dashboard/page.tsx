'use client';

import { Suspense } from 'react';
import UserDashboard from '@/components/admin/UserDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Loading component for the dashboard
const DashboardLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner 
      size="lg" 
      text="Loading your dashboard..." 
      variant="default"
    />
  </div>
);

// Error fallback for dashboard
const DashboardError = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Dashboard Unavailable</h2>
      <p className="text-muted-foreground">
        We're having trouble loading your dashboard. Please try refreshing the page.
      </p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated after loading completes
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while authentication is being verified
  if (loading) {
    return <DashboardLoader />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

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

        {/* Theme Test - Remove after testing */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-center">🎨 Theme Test</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 bg-background border border-border rounded flex items-center justify-center text-xs font-medium">
                      Background
                    </div>
                    <div className="h-12 bg-card border border-border rounded flex items-center justify-center text-xs font-medium">
                      Card
                    </div>
                    <div className="h-12 bg-primary text-primary-foreground rounded flex items-center justify-center text-xs font-medium">
                      Primary
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Use the theme toggle in the navbar to test light/dark switching
                    </p>
                  </div>
                </div>
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