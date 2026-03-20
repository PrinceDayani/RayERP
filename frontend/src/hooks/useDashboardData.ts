import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, initializeSocket } from '@/lib/socket';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (aligned with backend)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const statsCache = new Map<string, CacheEntry<any>>();

const getCachedStats = <T>(userId: string, key: string): T | null => {
  const cacheKey = `${userId}:${key}`;
  const entry = statsCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    statsCache.delete(cacheKey);
    return null;
  }
  return entry.data;
};

const setCachedStats = <T>(userId: string, key: string, data: T): void => {
  const cacheKey = `${userId}:${key}`;
  statsCache.set(cacheKey, { data, timestamp: Date.now() });
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
  // Currency data
  currency?: string;
  currencySymbol?: string;
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const FETCH_COOLDOWN = 3000;
  const DEBOUNCE_DELAY = 300;

  const fetchStats = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('auth-token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    // Get userId from token for cache key
    let userId = 'anonymous';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id || payload.userId || 'anonymous';
    } catch (e) {
      console.warn('Failed to parse token for cache key');
    }

    // Check cache first
    const cacheKey = 'dashboard-stats';
    if (!force) {
      const cached = getCachedStats<DashboardStats>(userId, cacheKey);
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

      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setStats(data);
        setCachedStats(userId, cacheKey, data);
        setError(null);
      } else {
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
        const token = localStorage.getItem('auth-token');
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
            setSocketConnected(true);
            if (token && socket.connected) {
              socket.emit('authenticate', token);
            }
            setTimeout(() => fetchStats(), 200);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        });

        socket.on('disconnect', () => {
          if (mounted) {
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

        // Debounced fetch for socket events
        const debouncedFetch = () => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            if (mounted) fetchStats();
          }, DEBOUNCE_DELAY);
        };

        socket.on('employee:created', debouncedFetch);
        socket.on('employee:updated', debouncedFetch);
        socket.on('employee:deleted', debouncedFetch);
        socket.on('project:created', debouncedFetch);
        socket.on('project:updated', debouncedFetch);
        socket.on('project:deleted', debouncedFetch);
        socket.on('task:created', debouncedFetch);
        socket.on('task:updated', debouncedFetch);
        socket.on('task:deleted', debouncedFetch);

        // Set initial connection state
        if (socket.connected) {
          setSocketConnected(true);
          if (token && socket.connected) {
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
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
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
