import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple query cache
const queryCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useOptimizedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      
      // Cache the result
      queryCache.set(key, {
        data: result,
        timestamp: Date.now(),
        staleTime
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, enabled, staleTime]);

  // Debounced fetch to prevent excessive calls
  const debouncedFetch = useCallback(debounce(fetchData, 300), [fetchData]);

  useEffect(() => {
    if (enabled) {
      debouncedFetch();
    }

    // Set up refetch interval
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, debouncedFetch, fetchData]);

  // Cleanup stale cache entries
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [cacheKey, cached] of queryCache.entries()) {
        if (now - cached.timestamp > cacheTime) {
          queryCache.delete(cacheKey);
        }
      }
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, [cacheTime]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}