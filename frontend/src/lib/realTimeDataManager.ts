// Real-time data manager for consistent updates across components
import { getSocket } from './socket';

export interface RealTimeData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    revenue: number;
    expenses: number;
    profit: number;
  };
  metrics: {
    activeUsers: number;
    systemLoad: number;
    lastUpdated: string;
  };
}

class RealTimeDataManager {
  private listeners: Map<string, (data: any) => void> = new Map();
  private data: RealTimeData = {
    stats: {
      totalEmployees: 0,
      activeEmployees: 0,
      totalProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      revenue: 0,
      expenses: 0,
      profit: 0,
    },
    metrics: {
      activeUsers: 0,
      systemLoad: 0,
      lastUpdated: new Date().toISOString(),
    }
  };

  constructor() {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners() {
    const socket = getSocket();
    if (!socket) return;

    socket.on('dashboard:stats', (newStats) => {
      try {
        this.updateStats(newStats);
      } catch (error) {
        console.warn('Failed to update stats:', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    socket.on('dashboard:metrics', (newMetrics) => {
      try {
        this.updateMetrics(newMetrics);
      } catch (error) {
        console.warn('Failed to update metrics:', error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  subscribe(key: string, callback: (data: any) => void) {
    this.listeners.set(key, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(key);
    };
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.forEach((callback, key) => {
      try {
        if (key.includes(type) || key === 'all') {
          callback(data);
        }
      } catch (error) {
        console.warn(`Listener notification failed for ${key}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  updateStats(newStats: Partial<RealTimeData['stats']>) {
    this.data.stats = { ...this.data.stats, ...newStats };
    this.data.metrics.lastUpdated = new Date().toISOString();
    this.notifyListeners('stats', this.data.stats);
  }

  updateMetrics(newMetrics: Partial<RealTimeData['metrics']>) {
    this.data.metrics = { ...this.data.metrics, ...newMetrics };
    this.notifyListeners('metrics', this.data.metrics);
  }

  getCurrentData(): RealTimeData {
    return { ...this.data };
  }

  // Simulate real-time updates for demo
  startSimulation() {
    const interval = setInterval(() => {
      try {
        const randomVariation = () => Math.floor(Math.random() * 5) + 1;
        
        this.updateStats({
          totalEmployees: 25 + randomVariation(),
          activeEmployees: 23 + randomVariation(),
          totalTasks: 156 + randomVariation(),
          completedTasks: 98 + randomVariation(),
          revenue: 485000 + (randomVariation() * 1000),
          expenses: 325000 + (randomVariation() * 500),
        });

        this.updateMetrics({
          activeUsers: Math.floor(Math.random() * 50) + 10,
          systemLoad: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('Simulation update failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, 5000);

    return () => clearInterval(interval);
  }
}

// Singleton instance
export const realTimeDataManager = new RealTimeDataManager();

// React hook for easy integration
import { useState, useEffect } from 'react';

export function useRealTimeData(dataType: 'stats' | 'metrics' | 'all' = 'all') {
  const [data, setData] = useState(realTimeDataManager.getCurrentData());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(socket?.connected || false);

    const unsubscribe = realTimeDataManager.subscribe(dataType, (newData) => {
      if (dataType === 'stats') {
        setData(prev => ({ ...prev, stats: newData }));
      } else if (dataType === 'metrics') {
        setData(prev => ({ ...prev, metrics: newData }));
      } else {
        setData(newData);
      }
    });

    // Listen for socket connection changes
    if (socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        unsubscribe();
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }

    return unsubscribe;
  }, [dataType]);

  return { data, isConnected };
}
