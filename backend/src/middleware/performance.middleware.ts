import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  route: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
}

const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    const metrics: PerformanceMetrics = {
      route: req.route?.path || req.path,
      method: req.method,
      duration,
      timestamp: new Date(),
      statusCode: res.statusCode,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Store metrics
    performanceMetrics.push(metrics);
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }

    // Set performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Memory-Usage', `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);

    originalEnd.apply(this, args);
  };

  next();
};

export const getPerformanceMetrics = () => {
  const now = Date.now();
  const last5Minutes = performanceMetrics.filter(
    metric => now - metric.timestamp.getTime() < 5 * 60 * 1000
  );

  const avgResponseTime = last5Minutes.reduce((sum, metric) => sum + metric.duration, 0) / last5Minutes.length || 0;
  const slowRequests = last5Minutes.filter(metric => metric.duration > 1000).length;
  const errorRequests = last5Minutes.filter(metric => metric.statusCode >= 400).length;

  return {
    totalRequests: last5Minutes.length,
    averageResponseTime: Math.round(avgResponseTime),
    slowRequests,
    errorRequests,
    errorRate: last5Minutes.length > 0 ? (errorRequests / last5Minutes.length) * 100 : 0,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
};