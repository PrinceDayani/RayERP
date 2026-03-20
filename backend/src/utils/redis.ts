import Redis from 'ioredis';

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
          console.warn('[Redis] Max retries reached, falling back to in-memory cache');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection error, using in-memory fallback:', err.message);
      isRedisAvailable = false;
    });

    redisClient.connect().catch(() => {
      console.warn('[Redis] Failed to connect, using in-memory cache');
      isRedisAvailable = false;
    });

  } catch (error) {
    console.warn('[Redis] Initialization failed, using in-memory cache:', error);
    isRedisAvailable = false;
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.warn('[Redis] Get failed, checking memory cache:', error);
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
    } catch (error) {
      console.warn('[Redis] Set failed, using memory cache:', error);
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
    } catch (error) {
      console.warn('[Redis] Delete failed:', error);
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
    } catch (error) {
      console.warn('[Redis] Delete pattern failed:', error);
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
    } catch (error) {
      console.warn('[Redis] Increment failed:', error);
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
    console.log('[Redis] Connection closed');
  }
  memoryCache.clear();
};
