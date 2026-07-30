"use client";

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
          }

          if (entry.entryType === 'paint') {
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });

      // Monitor memory usage in development
      if (process.env.NODE_ENV === 'development') {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
        }
      }

      return () => observer.disconnect();
    }
  }, []);

  return null;
}
