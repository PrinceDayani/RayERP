/**
 * Smart Cache with LRU Eviction for Financial Reports
 */

import { logger } from './logger';
import { CacheError } from './reportErrors';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  totalHits: number;
  totalSize: number;
  hitRate: number;
  entries: number;
}

export class SmartCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private totalRequests = 0;
  private totalHits = 0;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    this.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      logger.debug('Cache entry expired', { key });
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.totalHits++;

    logger.debug('Cache hit', { key, hits: entry.hits });
    return entry.data;
  }

  set(key: string, data: T): void {
    try {
      const size = this.calculateSize(data);

      // Evict if cache is full
      if (this.cache.size >= this.maxSize) {
        const lruKey = this.findLRU();
        this.cache.delete(lruKey);
        logger.debug('Cache eviction (LRU)', { evictedKey: lruKey });
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        hits: 0,
        size,
        lastAccessed: Date.now()
      };

      this.cache.set(key, entry);
      logger.debug('Cache set', { key, size });
    } catch (error) {
      logger.error('Cache set error', { key, error });
      throw new CacheError('Failed to set cache entry', { key, error });
    }
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.totalRequests = 0;
    this.totalHits = 0;
    logger.info('Cache cleared', { entriesCleared: size });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private findLRU(): string {
    let lruKey = '';
    let minScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score based on hits and last accessed time
      const ageScore = (Date.now() - entry.lastAccessed) / 1000; // seconds
      const hitScore = entry.hits > 0 ? 1 / entry.hits : 1000;
      const score = ageScore * hitScore;

      if (score < minScore) {
        minScore = score;
        lruKey = key;
      }
    }

    return lruKey;
  }

  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const hitRate = this.totalRequests > 0 ? (this.totalHits / this.totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      totalHits,
      totalSize,
      hitRate,
      entries: this.cache.size
    };
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { entriesCleaned: cleaned });
    }

    return cleaned;
  }

  // Get cache entries by pattern
  getByPattern(pattern: RegExp): T[] {
    const results: T[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        results.push(entry.data);
      }
    }

    return results;
  }

  // Invalidate cache entries by pattern
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info('Cache invalidated by pattern', { pattern: pattern.source, count: invalidated });
    }

    return invalidated;
  }
}

// Global cache instance
export const reportCache = new SmartCache();

// Cleanup interval (every 5 minutes)
setInterval(() => {
  reportCache.cleanup();
}, 5 * 60 * 1000);
