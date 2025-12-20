/**
 * Monitoring and Metrics Controller for Financial Reports
 */

import { Request, Response } from 'express';
import { performanceMonitor } from '../utils/performanceMonitor';
import { reportCache } from '../utils/smartCache';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Get comprehensive system metrics
 */
export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    const timeWindow = Number(req.query.timeWindow) || 3600000; // 1 hour default

    const performanceStats = performanceMonitor.getStats(timeWindow);
    const cacheStats = reportCache.getStats();
    const topEndpoints = performanceMonitor.getTopEndpoints(10);
    const recentErrors = performanceMonitor.getRecentErrors(10);

    // Database connection status
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStats = {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`
    };

    // System uptime
    const uptime = {
      process: `${(process.uptime() / 3600).toFixed(2)} hours`,
      system: `${(require('os').uptime() / 3600).toFixed(2)} hours`
    };

    res.json({
      success: true,
      data: {
        performance: performanceStats,
        cache: cacheStats,
        topEndpoints,
        recentErrors: recentErrors.map(e => ({
          endpoint: e.endpoint,
          timestamp: e.timestamp,
          duration: e.duration,
          userId: e.userId
        })),
        database: dbStatus,
        memory: memoryStats,
        uptime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error fetching system metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error fetching system metrics',
      error: error.message
    });
  }
};

/**
 * Get health check status
 */
export const getHealthCheck = async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };

    // Check if database is responsive
    if (mongoose.connection.readyState !== 1) {
      health.status = 'unhealthy';
      return res.status(503).json({ success: false, data: health });
    }

    res.json({ success: true, data: health });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
};

/**
 * Clear performance metrics
 */
export const clearMetrics = async (req: Request, res: Response) => {
  try {
    performanceMonitor.clearMetrics();
    
    logger.info('Performance metrics cleared', {
      userId: (req as any).user?.id
    });

    res.json({
      success: true,
      message: 'Performance metrics cleared successfully'
    });
  } catch (error: any) {
    logger.error('Error clearing metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error clearing metrics',
      error: error.message
    });
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (req: Request, res: Response) => {
  try {
    const stats = reportCache.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        hitRateFormatted: `${stats.hitRate.toFixed(2)}%`,
        totalSizeFormatted: `${(stats.totalSize / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error fetching cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error fetching cache statistics',
      error: error.message
    });
  }
};
