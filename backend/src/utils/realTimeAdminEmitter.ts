import { Server as SocketIOServer } from 'socket.io';
import { logger } from './logger';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';

interface RealTimeMetrics {
  activeUsers: number;
  totalSessions: number;
  systemLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  networkActivity: number;
  lastUpdated: string;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  ipAddress: string;
}

interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

class RealTimeAdminEmitter {
  private io: SocketIOServer | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private connectedAdmins = new Set<string>();

  initialize(io: SocketIOServer) {
    this.io = io;
    this.setupAdminNamespace();
    this.startMetricsCollection();
    logger.info('Real-time admin emitter initialized');
  }

  private setupAdminNamespace() {
    if (!this.io) return;

    // Handle admin connections
    this.io.on('connection', (socket) => {
      socket.on('admin:join', async (data) => {
        try {
          const { userId, token } = data;
          
          // Verify admin permissions
          const user = await User.findById(userId);
          if (!user || !this.hasAdminPermissions(user)) {
            socket.emit('admin:unauthorized');
            return;
          }

          // Join admin room
          socket.join('admin-room');
          this.connectedAdmins.add(socket.id);
          
          logger.info(`Admin ${user.email} joined real-time monitoring`);
          
          // Send initial data
          const metrics = await this.collectMetrics();
          socket.emit('admin:metrics', metrics);
          
          const recentActivity = await this.getRecentActivity();
          recentActivity.forEach(activity => {
            socket.emit('admin:activity', activity);
          });

        } catch (error) {
          logger.error('Admin join error:', error);
          socket.emit('admin:error', { message: 'Failed to join admin monitoring' });
        }
      });

      socket.on('disconnect', () => {
        this.connectedAdmins.delete(socket.id);
      });
    });
  }

  private hasAdminPermissions(user: any): boolean {
    const adminRoles = ['admin', 'super_admin', 'root'];
    return adminRoles.includes(user.role?.toLowerCase()) || 
           user.permissions?.includes('admin:access');
  }

  private startMetricsCollection() {
    // Collect and emit metrics every 10 seconds
    this.metricsInterval = setInterval(async () => {
      if (this.connectedAdmins.size === 0) return;

      try {
        const metrics = await this.collectMetrics();
        this.emitToAdmins('admin:metrics', metrics);
      } catch (error) {
        logger.error('Metrics collection error:', error);
      }
    }, 10000);
  }

  private async collectMetrics(): Promise<RealTimeMetrics> {
    try {
      // Get active users count
      const activeUsers = await User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      });

      const totalSessions = this.io?.engine?.clientsCount || 0;

      // System metrics (simulated - replace with actual system monitoring)
      const systemLoad = Math.floor(Math.random() * 100);
      const memoryUsage = Math.floor(Math.random() * 100);
      const cpuUsage = Math.floor(Math.random() * 100);
      const networkActivity = Math.floor(Math.random() * 1000);

      return {
        activeUsers,
        totalSessions,
        systemLoad,
        memoryUsage,
        cpuUsage,
        networkActivity,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error collecting metrics:', error);
      return {
        activeUsers: 0,
        totalSessions: 0,
        systemLoad: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkActivity: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async getRecentActivity(): Promise<UserActivity[]> {
    try {
      const logs = await ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();

      return logs.map(log => ({
        id: log._id.toString(),
        userId: (log as any).userId || 'system',
        userName: log.user?.toString() || 'Unknown',
        action: log.action,
        resource: log.resource,
        timestamp: log.timestamp.toISOString(),
        status: log.status as 'success' | 'warning' | 'error',
        ipAddress: log.ipAddress
      }));
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Public methods for emitting events
  emitUserActivity(activity: Partial<UserActivity>) {
    const fullActivity: UserActivity = {
      id: activity.id || new Date().getTime().toString(),
      userId: activity.userId || 'system',
      userName: activity.userName || 'System',
      action: activity.action || 'unknown',
      resource: activity.resource || 'system',
      timestamp: activity.timestamp || new Date().toISOString(),
      status: activity.status || 'success',
      ipAddress: activity.ipAddress || 'unknown'
    };

    this.emitToAdmins('admin:activity', fullActivity);
  }

  emitSystemAlert(alert: Partial<SystemAlert>) {
    const fullAlert: SystemAlert = {
      id: alert.id || new Date().getTime().toString(),
      type: alert.type || 'system',
      severity: alert.severity || 'medium',
      message: alert.message || 'System notification',
      timestamp: alert.timestamp || new Date().toISOString(),
      resolved: alert.resolved || false
    };

    this.emitToAdmins('admin:alert', fullAlert);
    
    // Log critical alerts
    if (fullAlert.severity === 'critical') {
      logger.warn(`Critical system alert: ${fullAlert.message}`);
    }
  }

  emitUserLogin(userId: string, userName: string, ipAddress: string) {
    this.emitUserActivity({
      userId,
      userName,
      action: 'login',
      resource: 'authentication',
      status: 'success',
      ipAddress
    });
  }

  emitUserLogout(userId: string, userName: string, ipAddress: string) {
    this.emitUserActivity({
      userId,
      userName,
      action: 'logout',
      resource: 'authentication',
      status: 'success',
      ipAddress
    });
  }

  emitFailedLogin(email: string, ipAddress: string) {
    this.emitUserActivity({
      userId: 'unknown',
      userName: email,
      action: 'failed_login',
      resource: 'authentication',
      status: 'error',
      ipAddress
    });

    // Emit security alert for failed logins
    this.emitSystemAlert({
      type: 'security',
      severity: 'medium',
      message: `Failed login attempt for ${email} from ${ipAddress}`
    });
  }

  emitPermissionDenied(userId: string, userName: string, resource: string, ipAddress: string) {
    this.emitUserActivity({
      userId,
      userName,
      action: 'permission_denied',
      resource,
      status: 'warning',
      ipAddress
    });

    this.emitSystemAlert({
      type: 'security',
      severity: 'high',
      message: `Permission denied for ${userName} accessing ${resource}`
    });
  }

  emitDataModification(userId: string, userName: string, resource: string, action: string, ipAddress: string) {
    this.emitUserActivity({
      userId,
      userName,
      action,
      resource,
      status: 'success',
      ipAddress
    });
  }

  emitSystemError(error: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    this.emitSystemAlert({
      type: 'system',
      severity,
      message: error
    });
  }

  emitPerformanceAlert(metric: string, value: number, threshold: number) {
    this.emitSystemAlert({
      type: 'performance',
      severity: value > threshold * 1.5 ? 'critical' : 'high',
      message: `${metric} is at ${value}% (threshold: ${threshold}%)`
    });
  }

  private emitToAdmins(event: string, data: any) {
    if (!this.io || this.connectedAdmins.size === 0) return;
    
    this.io.to('admin-room').emit(event, data);
  }

  // Cleanup
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    this.connectedAdmins.clear();
    logger.info('Real-time admin emitter destroyed');
  }
}

export const realTimeAdminEmitter = new RealTimeAdminEmitter();
export default realTimeAdminEmitter;