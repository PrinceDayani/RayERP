// Dashboard cache invalidation utility
type CacheInvalidator = () => void;

const invalidators: CacheInvalidator[] = [];

export const registerCacheInvalidator = (fn: CacheInvalidator) => {
  invalidators.push(fn);
};

export const invalidateDashboardCache = () => {
  invalidators.forEach(fn => fn());
};
