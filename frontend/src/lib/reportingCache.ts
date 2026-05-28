import type { DailyReport, ReportingSchedule } from './api/projectReportingAPI';

const TTL_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
}

function createEntityCache<T extends { _id: string }>() {
  const store = new Map<string, CacheEntry<T>>();
  return {
    set(item: T) {
      store.set(item._id, { data: item, updatedAt: Date.now() });
    },
    setMany(items: T[]) {
      const now = Date.now();
      for (const item of items) store.set(item._id, { data: item, updatedAt: now });
    },
    get(id: string): T | null {
      return store.get(id)?.data ?? null;
    },
    isStale(id: string): boolean {
      const entry = store.get(id);
      if (!entry) return true;
      return Date.now() - entry.updatedAt > TTL_MS;
    },
    invalidate(id: string) {
      store.delete(id);
    }
  };
}

export const reportCache = createEntityCache<DailyReport>();
export const scheduleCache = createEntityCache<ReportingSchedule>();
