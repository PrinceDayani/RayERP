import { Server as SocketIOServer } from 'socket.io';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';
import { logger } from './logger';

export class RealTimeEmitter {
  private static ioInstance: any = null;

  static initialize(io: any) {
    this.ioInstance = io;
  }

  static async emitDashboardStats() {
    if (!this.ioInstance) return;
    
    try {
      // Counted in the database rather than loaded into memory: this runs on
      // every task and project mutation.
      const [
        totalEmployees,
        activeEmployees,
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        budgetTotals
      ] = await Promise.all([
        Employee.countDocuments({}),
        Employee.countDocuments({ status: 'active' }),
        Project.countDocuments({}),
        Project.countDocuments({ status: 'active' }),
        Project.countDocuments({ status: 'completed' }),
        Task.countDocuments({}),
        Task.countDocuments({ status: 'completed' }),
        Task.countDocuments({ status: 'in-progress' }),
        Task.countDocuments({ status: 'todo' }),
        Project.aggregate([
          {
            $group: {
              _id: null,
              revenue: { $sum: { $ifNull: ['$budget', 0] } },
              expenses: { $sum: { $ifNull: ['$spentBudget', 0] } }
            }
          }
        ])
      ]);

      const stats = {
        totalEmployees,
        activeEmployees,
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        revenue: budgetTotals[0]?.revenue || 0,
        expenses: budgetTotals[0]?.expenses || 0,
        profit: 0,
        timestamp: new Date().toISOString()
      };

      stats.profit = stats.revenue - stats.expenses;

      this.ioInstance.emit('dashboard:stats', stats);
    } catch (error: any) {
      logger.error('Error emitting dashboard stats', { message: error?.message });
    }
  }

  static emitMetricsUpdate(data: any) {
    if (!this.ioInstance) return;
    
    this.ioInstance.emit('metrics_update', {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalRevenue: data.totalRevenue || 0,
      systemLoad: Math.floor(Math.random() * 100),
      lastUpdated: new Date().toISOString()
    });
  }

  static async emitActivityLog(activity: { type: string; message: string; user?: string; userId?: string; metadata?: any }) {
    if (!this.ioInstance) return;
    
    try {
      const activityData = {
        id: Date.now().toString(),
        type: activity.type,
        message: activity.message,
        user: activity.user || 'System',
        userId: activity.userId,
        metadata: activity.metadata,
        timestamp: new Date().toISOString(),
        priority: 'normal'
      };

      // Broadcast to all connected clients
      this.ioInstance.emit('activity_log', activityData);

      // Send high-priority notification to Root users room
      this.ioInstance.to('root-users').emit('root:activity', {
        ...activityData,
        priority: 'high'
      });

      // Store in database for history
      const ActivityLog = (await import('../models/ActivityLog')).default;
      await ActivityLog.create({
        type: activity.type,
        action: activity.type,
        description: activity.message,
        user: activity.userId,
        userName: activity.user,
        metadata: activity.metadata,
        timestamp: new Date(),
        status: 'success',
        visibility: 'all'
      }).catch((err: any) => logger.error('Failed to store activity', { message: err?.message }));
    } catch (error: any) {
      logger.error('Error emitting activity log', { message: error?.message });
    }
  }

  static emitSystemStatus(status: { database: string; api: string; socket: string }) {
    if (!this.ioInstance) return;
    
    this.ioInstance.emit('system_status', status);
  }

  static startIntervals() {
    // Auto-emit dashboard stats every 30 seconds
    setInterval(() => {
      RealTimeEmitter.emitDashboardStats();
    }, 30000);

    // Auto-emit metrics every 15 seconds
    setInterval(() => {
      RealTimeEmitter.emitMetricsUpdate({});
    }, 15000);
  }
}