"use client";

import { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
  fallback?: React.ReactNode;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function OptimizedLazyComponent(props: React.ComponentProps<T> & LazyComponentProps) {
    const { fallback: propsFallback, ...componentProps } = props;
    return (
      <Suspense fallback={fallback || propsFallback || <LoadingSpinner />}>
        <LazyComponent {...(componentProps as React.ComponentProps<T>)} />
      </Suspense>
    );
  };
}

// Pre-configured lazy components for common use cases
export const LazyAnalyticsCharts = createLazyComponent(
  () => import('./Dashboard/AnalyticsCharts'),
  <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
);

export const LazyProjectAnalytics = createLazyComponent(
  () => import('./ProjectAnalytics'),
  <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>
);

export const LazyRealTimeChart = createLazyComponent(
  () => import('./RealTimeChart'),
  <div className="h-40 flex items-center justify-center"><LoadingSpinner /></div>
);