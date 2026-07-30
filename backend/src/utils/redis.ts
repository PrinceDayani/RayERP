import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiry: number }>();

export const initRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('[Redis] Max retries reached, falling back to in-memory cache');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      logger.warn('[Redis] Connection error, using in-memory fallback', { message: err.message });
      isRedisAvailable = false;
    });

    redisClient.connect().catch(() => {
      logger.warn('[Redis] Failed to connect, using in-memory cache');
      isRedisAvailable = false;
    });

  } catch (error: any) {
    logger.warn('[Redis] Initialization failed, using in-memory cache', { message: error?.message });
    isRedisAvailable = false;
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (error: any) {
      logger.warn('[Redis] Get failed, checking memory cache', { message: error?.message });
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  memoryCache.delete(key);
  return null;
};

export const setCache = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, value);
      return;
    } catch (error: any) {
      logger.warn('[Redis] Set failed, using memory cache', { message: error?.message });
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
};

export const deleteCache = async (key: string): Promise<void> => {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error: any) {
      logger.warn('[Redis] Delete failed', { message: error?.message });
    }
  }
  memoryCache.delete(key);
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error: any) {
      logger.warn('[Redis] Delete pattern failed', { message: error?.message });
    }
  }

  // Fallback: clear matching keys from memory cache
  for (const key of memoryCache.keys()) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};

export const incrementCounter = async (key: string, ttlSeconds: number = 60): Promise<number> => {
  if (isRedisAvailable && redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return count;
    } catch (error: any) {
      logger.warn('[Redis] Increment failed', { message: error?.message });
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  const currentCount = cached ? parseInt(cached.value) : 0;
  const newCount = currentCount + 1;
  
  memoryCache.set(key, {
    value: String(newCount),
    expiry: Date.now() + (ttlSeconds * 1000)
  });
  
  return newCount;
};

export const getRedisClient = () => redisClient;
export const isRedisConnected = () => isRedisAvailable;

// Cleanup on shutdown
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  memoryCache.clear();
};
