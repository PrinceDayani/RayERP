import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, initializeSocket } from '@/lib/socket';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const statsCache = new Map<string, CacheEntry<any>>();

const getCachedStats = <T>(key: string): T | null => {
  const entry = statsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    statsCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCachedStats = <T>(key: string, data: T): void => {
  statsCache.set(key, { data, timestamp: Date.now() });
};

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  revenue: number;
  expenses: number;
  profit: number;
  // Sales data
  salesRevenue?: number;
  salesPaid?: number;
  salesPending?: number;
  salesCount?: number;
  // Project data
  projectRevenue?: number;
  projectExpenses?: number;
  projectProfit?: number;
  timestamp?: string;
}

interface UseDashboardDataReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  socketConnected: boolean;
  refresh: () => Promise<void>;
}

export const useDashboardData = (isAuthenticated: boolean): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
    salesRevenue: 0,
    salesPaid: 0,
    salesPending: 0,
    salesCount: 0,
    projectRevenue: 0,
    projectExpenses: 0,
    projectProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN = 5000;

  const fetchStats = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = 'dashboard-stats';
    if (!force) {
      const cached = getCachedStats<DashboardStats>(cacheKey);
      if (cached) {
        setStats(cached);
        setLoading(false);
        return;
      }
    }

    const now = Date.now();
    if (!force && now - lastFetchRef.current < FETCH_COOLDOWN) return;
    lastFetchRef.current = now;

    try {
      const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      console.log('[Dashboard] Fetching stats from:', `${API_URL}/api/dashboard/stats`);
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      console.log('[Dashboard] Stats response:', response.data);
      if (response.data.success) {
        const data = response.data.data;
        setStats(data);
        setCachedStats(cacheKey, data);
        setError(null);
      } else {
        console.error('[Dashboard] Stats fetch failed:', response.data);
        setError(response.data.message || 'Failed to fetch statistics');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed');
        localStorage.removeItem('auth-token');
      } else if (err.response?.status === 403) {
        setError('Permission denied: dashboard.view required');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timeout - server may be slow');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch statistics');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  // Refetch on tab visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, fetchStats]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const initSocket = async () => {
      try {
        const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
        const socket = await initializeSocket(token || undefined);
        if (!mounted || !socket) {
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(() => fetchStats(true), 60000);
          }
          return;
        }

        socketRef.current = socket;

        socket.on('connect', () => {
          if (mounted) {
            console.log('Dashboard socket connected');
            setSocketConnected(true);
            // Authenticate socket
            if (token) {
              socket.emit('authenticate', token);
            }
            // Fetch stats immediately on connect
            fetchStats();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        });

        socket.on('disconnect', () => {
          if (mounted) {
            console.log('Dashboard socket disconnected');
            setSocketConnected(false);
            if (!pollingIntervalRef.current) {
              pollingIntervalRef.current = setInterval(() => fetchStats(true), 60000);
            }
          }
        });

        socket.on('dashboard:stats', (newStats: DashboardStats) => {
          if (mounted) {
            setStats(newStats);
          }
        });

        socket.on('employee:created', fetchStats);
        socket.on('employee:updated', fetchStats);
        socket.on('employee:deleted', fetchStats);
        socket.on('project:created', fetchStats);
        socket.on('project:updated', fetchStats);
        socket.on('project:deleted', fetchStats);
        socket.on('task:created', fetchStats);
        socket.on('task:updated', fetchStats);
        socket.on('task:deleted', fetchStats);

        // Set initial connection state
        if (socket.connected) {
          setSocketConnected(true);
          if (token) {
            socket.emit('authenticate', token);
          }
        }

      } catch (err) {
        console.warn('Socket initialization failed, using polling:', err);
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(() => fetchStats(true), 60000);
        }
      }
    };

    initSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('dashboard:stats');
        socketRef.current.off('employee:created');
        socketRef.current.off('employee:updated');
        socketRef.current.off('employee:deleted');
        socketRef.current.off('project:created');
        socketRef.current.off('project:updated');
        socketRef.current.off('project:deleted');
        socketRef.current.off('task:created');
        socketRef.current.off('task:updated');
        socketRef.current.off('task:deleted');
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchStats]);

  return {
    stats,
    loading,
    error,
    socketConnected,
    refresh: fetchStats
  };
};
