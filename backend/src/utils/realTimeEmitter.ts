import { io } from '../server';

export class RealTimeEmitter {
  static emitMetricsUpdate(data: any) {
    io.emit('metrics_update', {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalRevenue: data.totalRevenue || 0,
      ordersToday: data.ordersToday || 0,
      systemLoad: Math.floor(Math.random() * 100),
      lastUpdated: new Date().toISOString()
    });
  }

  static emitActivityLog(activity: { type: string; message: string; user?: string }) {
    io.emit('activity_log', {
      id: Date.now().toString(),
      ...activity,
      timestamp: new Date().toISOString()
    });
  }

  static emitSystemStatus(status: { database: string; api: string; socket: string }) {
    io.emit('system_status', status);
  }
}

// Auto-emit metrics every 5 seconds
setInterval(() => {
  RealTimeEmitter.emitMetricsUpdate({});
}, 5000);