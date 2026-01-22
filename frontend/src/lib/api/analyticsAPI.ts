import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (): void => {
  cache.clear();
};

export interface AnalyticsResponse {
  projectProgress: Array<{ name: string; progress: number; status: string }>;
  taskDistribution: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; time: string }>;
}

const analyticsAPI = {
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const cacheKey = 'dashboard-analytics';
    const cached = getCached<AnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/dashboard/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data.data;
    setCache(cacheKey, data);
    return data;
  },

  getDashboardAnalytics: async (): Promise<AnalyticsResponse> => {
    return analyticsAPI.getAnalytics();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (!token) return false;
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },

  clearCache
};

export { analyticsAPI };
export default analyticsAPI;