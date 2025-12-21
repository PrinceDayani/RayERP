// backend/src/utils/contactHealthCheck.ts
import Contact from '../models/Contact';
import { logger } from './logger';

export interface ContactHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  totalContacts: number;
  activeContacts: number;
  customerContacts: number;
  responseTime: number;
  lastChecked: Date;
  errors?: string[];
}

export class ContactHealthChecker {
  private static instance: ContactHealthChecker;
  private lastHealthCheck: ContactHealthStatus | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private healthCheckTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHealthChecks();
  }

  public static getInstance(): ContactHealthChecker {
    if (!ContactHealthChecker.instance) {
      ContactHealthChecker.instance = new ContactHealthChecker();
    }
    return ContactHealthChecker.instance;
  }

  public async performHealthCheck(): Promise<ContactHealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Test basic database connectivity
      const [totalContacts, activeContacts, customerContacts] = await Promise.all([
        Contact.countDocuments().maxTimeMS(5000),
        Contact.countDocuments({ status: 'active' }).maxTimeMS(5000),
        Contact.countDocuments({ isCustomer: true }).maxTimeMS(5000)
      ]);

      const responseTime = Date.now() - startTime;

      // Determine health status based on response time and data integrity
      if (responseTime > 5000) {
        status = 'unhealthy';
        errors.push('Database response time exceeds 5 seconds');
      } else if (responseTime > 2000) {
        status = 'degraded';
        errors.push('Database response time is slow (>2s)');
      }

      // Check for data integrity issues
      if (totalContacts < 0 || activeContacts < 0 || customerContacts < 0) {
        status = 'unhealthy';
        errors.push('Invalid contact counts detected');
      }

      if (activeContacts > totalContacts || customerContacts > totalContacts) {
        status = 'degraded';
        errors.push('Contact count inconsistencies detected');
      }

      const healthStatus: ContactHealthStatus = {
        status,
        totalContacts,
        activeContacts,
        customerContacts,
        responseTime,
        lastChecked: new Date(),
        errors: errors.length > 0 ? errors : undefined
      };

      this.lastHealthCheck = healthStatus;

      if (status !== 'healthy') {
        logger.warn('Contact system health check failed', healthStatus);
      } else {
        logger.info('Contact system health check passed', {
          totalContacts,
          activeContacts,
          customerContacts,
          responseTime
        });
      }

      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthStatus: ContactHealthStatus = {
        status: 'unhealthy',
        totalContacts: -1,
        activeContacts: -1,
        customerContacts: -1,
        responseTime,
        lastChecked: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown database error']
      };

      this.lastHealthCheck = healthStatus;
      logger.error('Contact system health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      return healthStatus;
    }
  }

  public getLastHealthCheck(): ContactHealthStatus | null {
    return this.lastHealthCheck;
  }

  public startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Perform initial health check
    this.performHealthCheck();

    // Schedule periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    logger.info('Contact health checks started', {
      interval: this.HEALTH_CHECK_INTERVAL / 1000 + ' seconds'
    });
  }

  public stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Contact health checks stopped');
    }
  }

  public async getDetailedMetrics(): Promise<{
    health: ContactHealthStatus;
    metrics: {
      contactsByVisibility: Record<string, number>;
      contactsByType: Record<string, number>;
      contactsByPriority: Record<string, number>;
      recentActivity: {
        createdToday: number;
        updatedToday: number;
        createdThisWeek: number;
      };
    };
  }> {
    const health = await this.performHealthCheck();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      const [
        contactsByVisibility,
        contactsByType,
        contactsByPriority,
        createdToday,
        updatedToday,
        createdThisWeek
      ] = await Promise.all([
        Contact.aggregate([
          { $group: { _id: '$visibilityLevel', count: { $sum: 1 } } }
        ]),
        Contact.aggregate([
          { $group: { _id: '$contactType', count: { $sum: 1 } } }
        ]),
        Contact.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Contact.countDocuments({ createdAt: { $gte: today } }),
        Contact.countDocuments({ updatedAt: { $gte: today } }),
        Contact.countDocuments({ createdAt: { $gte: weekAgo } })
      ]);

      const metrics = {
        contactsByVisibility: contactsByVisibility.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        contactsByType: contactsByType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        contactsByPriority: contactsByPriority.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: {
          createdToday,
          updatedToday,
          createdThisWeek
        }
      };

      return { health, metrics };
    } catch (error) {
      logger.error('Error getting detailed contact metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        health,
        metrics: {
          contactsByVisibility: {},
          contactsByType: {},
          contactsByPriority: {},
          recentActivity: {
            createdToday: -1,
            updatedToday: -1,
            createdThisWeek: -1
          }
        }
      };
    }
  }
}

// Export singleton instance
export const contactHealthChecker = ContactHealthChecker.getInstance();