/**
 * Performance Monitoring for Financial Reports
 */

import { performance } from 'perf_hooks';
import { logger } from './logger';

export interface PerformanceMetrics {
  endpoint: string;
  duration: number;
  cacheHit: boolean;
  recordCount: number;
  timestamp: Date;
  userId?: string;
  error?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 10000;

  async trackPerformance<T>(
    endpoint: string,
    operation: () => Promise<T>,
    options: { cacheHit?: boolean; userId?: string } = {}
  ): Promise<T> {
    const start = performance.now();
    let error = false;
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (err) {
      error = true;
      throw err;
    } finally {
      const duration = performance.now() - start;
      
      const metric: PerformanceMetrics = {
        endpoint,
        duration,
        cacheHit: options.cacheHit || false,
        recordCount: this.getRecordCount(result!),
        timestamp: new Date(),
        userId: options.userId,
        error
      };

      this.addMetric(metric);

      // Log slow queries
      if (duration > 2000) {
        logger.warn('Slow query detected', {
          endpoint,
          duration: `${duration.toFixed(2)}ms`,
          cacheHit: options.cacheHit,
          userId: options.userId
        });
      }

      // Log errors
      if (error) {
        logger.error('Operation failed', {
          endpoint,
          duration: `${duration.toFixed(2)}ms`,
          userId: options.userId
        });
      }
    }
  }

  private getRecordCount(result: any): number {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (result.data && Array.isArray(result.data)) return result.data.length;
    if (result.accounts && Array.isArray(result.accounts)) return result.accounts.length;
    return 1;
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats(timeWindow: number = 3600000): {
    totalRequests: number;
    averageDuration: number;
    cacheHitRate: number;
    slowQueries: number;
    errorRate: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < timeWindow
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        slowQueries: 0,
        errorRate: 0,
        p95Duration: 0,
        p99Duration: 0
      };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      totalRequests: recentMetrics.length,
      averageDuration: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      cacheHitRate: (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100,
      slowQueries: recentMetrics.filter(m => m.duration > 2000).length,
      errorRate: (recentMetrics.filter(m => m.error).length / recentMetrics.length) * 100,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0
    };
  }

  getTopEndpoints(limit: number = 10): Array<{ endpoint: string; count: number; avgDuration: number }> {
    const endpointStats = new Map<string, { count: number; totalDuration: number }>();

    for (const metric of this.metrics) {
      const stats = endpointStats.get(metric.endpoint) || { count: 0, totalDuration: 0 };
      stats.count++;
      stats.totalDuration += metric.duration;
      endpointStats.set(metric.endpoint, stats);
    }

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getRecentErrors(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.error)
      .slice(-limit)
      .reverse();
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
