// Cache utility for finance modules
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class FinanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export const financeCache = new FinanceCache();
