import React, { Suspense, lazy } from 'react';
import { Spinner } from './ui/spinner';

// Lazy load components with error boundary
export const createLazyComponent = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Spinner /></div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-defined lazy components for common modules
export const LazyDashboard = createLazyComponent(() => import('../app/dashboard/page'));
export const LazyProjects = createLazyComponent(() => import('../components/projects/ProjectList'));
export const LazyFinance = createLazyComponent(() => import('../components/finance/FinanceDashboardConnected'));
export const LazyReports = createLazyComponent(() => import('../components/finance/FinancialReports'));
export const LazyUsers = createLazyComponent(() => import('../components/admin/UserManagement'));
export const LazySettings = createLazyComponent(() => import('../app/dashboard/settings/page'));

// Dynamic import helper
export const dynamicImport = (modulePath: string) => {
  return lazy(() => import(modulePath));
};