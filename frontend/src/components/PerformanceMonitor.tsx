"use client";

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');
          }
          
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}:`, entry.startTime, 'ms');
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });

      // Monitor memory usage in development
      if (process.env.NODE_ENV === 'development') {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          console.log('Memory Usage:', {
            used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + ' MB'
          });
        }
      }

      return () => observer.disconnect();
    }
  }, []);

  return null;
}