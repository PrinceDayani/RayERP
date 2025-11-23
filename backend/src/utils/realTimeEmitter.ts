import { Server as SocketIOServer } from 'socket.io';
import Employee from '../models/Employee';
import Project from '../models/Project';
import Task from '../models/Task';

export class RealTimeEmitter {
  private static ioInstance: any = null;

  static initialize(io: any) {
    this.ioInstance = io;
  }

  static async emitDashboardStats() {
    if (!this.ioInstance) return;
    
    try {
      const [employees, projects, tasks] = await Promise.all([
        Employee.find(),
        Project.find(),
        Task.find()
      ]);

      const stats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'active').length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        pendingTasks: tasks.filter(t => t.status === 'todo').length,
        revenue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        expenses: projects.reduce((sum, p) => sum + (p.spentBudget || 0), 0),
        profit: 0,
        timestamp: new Date().toISOString()
      };

      stats.profit = stats.revenue - stats.expenses;

      this.ioInstance.emit('dashboard:stats', stats);
    } catch (error) {
      console.error('Error emitting dashboard stats:', error);
    }
  }

  static emitMetricsUpdate(data: any) {
    if (!this.ioInstance) return;
    
    this.ioInstance.emit('metrics_update', {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalRevenue: data.totalRevenue || 0,
      ordersToday: data.ordersToday || 0,
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
      }).catch(err => console.error('Failed to store activity:', err));
    } catch (error) {
      console.error('Error emitting activity log:', error);
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