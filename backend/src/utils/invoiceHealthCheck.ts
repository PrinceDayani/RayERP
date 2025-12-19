import Invoice from '../models/Invoice';
import { logger } from './logger';

export interface InvoiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalOutstanding: number;
  responseTime: number;
  lastChecked: Date;
  errors?: string[];
}

export class InvoiceHealthChecker {
  private static instance: InvoiceHealthChecker;
  private lastHealthCheck: InvoiceHealthStatus | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private healthCheckTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHealthChecks();
  }

  public static getInstance(): InvoiceHealthChecker {
    if (!InvoiceHealthChecker.instance) {
      InvoiceHealthChecker.instance = new InvoiceHealthChecker();
    }
    return InvoiceHealthChecker.instance;
  }

  public async performHealthCheck(): Promise<InvoiceHealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      const [
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        outstandingResult
      ] = await Promise.all([
        Invoice.countDocuments().timeout(5000),
        Invoice.countDocuments({ status: 'PAID' }).timeout(5000),
        Invoice.countDocuments({
          status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] },
          dueDate: { $lt: new Date() },
          balanceAmount: { $gt: 0 }
        }).timeout(5000),
        Invoice.aggregate([
          { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
        ]).timeout(5000)
      ]);

      const totalOutstanding = outstandingResult[0]?.total || 0;
      const responseTime = Date.now() - startTime;

      // Determine health status
      if (responseTime > 5000) {
        status = 'unhealthy';
        errors.push('Database response time exceeds 5 seconds');
      } else if (responseTime > 2000) {
        status = 'degraded';
        errors.push('Database response time is slow (>2s)');
      }

      // Check for data integrity issues
      if (totalInvoices < 0 || paidInvoices < 0 || overdueInvoices < 0) {
        status = 'unhealthy';
        errors.push('Invalid invoice counts detected');
      }

      if (paidInvoices > totalInvoices || overdueInvoices > totalInvoices) {
        status = 'degraded';
        errors.push('Invoice count inconsistencies detected');
      }

      // Check for high overdue percentage
      const overduePercentage = totalInvoices > 0 ? (overdueInvoices / totalInvoices) * 100 : 0;
      if (overduePercentage > 30) {
        status = status === 'healthy' ? 'degraded' : status;
        errors.push(`High overdue percentage: ${overduePercentage.toFixed(1)}%`);
      }

      const healthStatus: InvoiceHealthStatus = {
        status,
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        totalOutstanding,
        responseTime,
        lastChecked: new Date(),
        errors: errors.length > 0 ? errors : undefined
      };

      this.lastHealthCheck = healthStatus;

      if (status !== 'healthy') {
        logger.warn('Invoice system health check failed', healthStatus);
      } else {
        logger.info('Invoice system health check passed', {
          totalInvoices,
          paidInvoices,
          overdueInvoices,
          totalOutstanding,
          responseTime
        });
      }

      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthStatus: InvoiceHealthStatus = {
        status: 'unhealthy',
        totalInvoices: -1,
        paidInvoices: -1,
        overdueInvoices: -1,
        totalOutstanding: -1,
        responseTime,
        lastChecked: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown database error']
      };

      this.lastHealthCheck = healthStatus;
      logger.error('Invoice system health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      return healthStatus;
    }
  }

  public getLastHealthCheck(): InvoiceHealthStatus | null {
    return this.lastHealthCheck;
  }

  public startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.performHealthCheck();

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    logger.info('Invoice health checks started');
  }

  public stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Invoice health checks stopped');
    }
  }

  public async getDetailedMetrics(): Promise<{
    health: InvoiceHealthStatus;
    metrics: {
      invoicesByStatus: Record<string, number>;
      monthlyTrends: Array<{ month: string; count: number; amount: number }>;
      topCustomers: Array<{ customer: string; count: number; amount: number }>;
      averagePaymentTime: number;
    };
  }> {
    const health = await this.performHealthCheck();
    
    try {
      const [
        invoicesByStatus,
        monthlyTrends,
        topCustomers,
        paymentTimes
      ] = await Promise.all([
        Invoice.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Invoice.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$invoiceDate' },
                month: { $month: '$invoiceDate' }
              },
              count: { $sum: 1 },
              amount: { $sum: '$totalAmount' }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ]),
        Invoice.aggregate([
          { $match: { customerId: { $exists: true } } },
          {
            $group: {
              _id: '$partyName',
              count: { $sum: 1 },
              amount: { $sum: '$totalAmount' }
            }
          },
          { $sort: { amount: -1 } },
          { $limit: 10 }
        ]),
        Invoice.aggregate([
          { $match: { status: 'PAID', paidDate: { $exists: true } } },
          {
            $project: {
              paymentDays: {
                $divide: [
                  { $subtract: ['$paidDate', '$invoiceDate'] },
                  86400000
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgPaymentTime: { $avg: '$paymentDays' }
            }
          }
        ])
      ]);

      const metrics = {
        invoicesByStatus: invoicesByStatus.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {} as Record<string, number>),
        monthlyTrends: monthlyTrends.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          count: item.count,
          amount: item.amount
        })),
        topCustomers: topCustomers.map(item => ({
          customer: item._id || 'Unknown',
          count: item.count,
          amount: item.amount
        })),
        averagePaymentTime: paymentTimes[0]?.avgPaymentTime || 0
      };

      return { health, metrics };
    } catch (error) {
      logger.error('Error getting detailed invoice metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        health,
        metrics: {
          invoicesByStatus: {},
          monthlyTrends: [],
          topCustomers: [],
          averagePaymentTime: -1
        }
      };
    }
  }
}

export const invoiceHealthChecker = InvoiceHealthChecker.getInstance();