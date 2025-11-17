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

  static emitActivityLog(activity: { type: string; message: string; user?: string }) {
    if (!this.ioInstance) return;
    
    this.ioInstance.emit('activity_log', {
      id: Date.now().toString(),
      ...activity,
      timestamp: new Date().toISOString()
    });
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