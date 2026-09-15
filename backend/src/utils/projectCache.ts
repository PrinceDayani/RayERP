//path: backend/src/utils/projectCache.ts

// Version-stamped cache for the projects list. Invalidation bumps a single
// counter, so no KEYS/SCAN sweep is ever needed — stale entries simply age out.
//
// SECURITY: `scope` is what keeps one user's visible project set out of another
// user's cache entry. Callers MUST pass 'all' only for privileged users (those
// for whom access resolution returned every project) and `u:<userId>` for
// everyone else. Never share a scope across users with different visibility.

import { getCache, setCache } from './redis';

const PROJECT_LIST_TTL_SECONDS = 60;
const VERSION_TTL_SECONDS = 86400;
const VERSION_KEY = 'projects:list:version';

export const getProjectListVersion = async (): Promise<string> => {
  const version = await getCache(VERSION_KEY);
  return version ?? '0';
};

export const buildProjectListKey = (scope: string, queryKey: string, version: string): string =>
  `projects:list:v${version}:${scope}:${queryKey}`;

// Other project read models (stats, facets) share the list's version counter,
// so any project write invalidates all of them together.
export type ProjectCacheView = 'list' | 'stats' | 'facets';

const buildViewKey = (view: ProjectCacheView, scope: string, queryKey: string, version: string) =>
  view === 'list' ? buildProjectListKey(scope, queryKey, version) : `projects:${view}:v${version}:${scope}:${queryKey}`;

export const getCachedProjectView = async <T>(view: ProjectCacheView, scope: string, queryKey: string): Promise<T | null> => {
  const version = await getProjectListVersion();
  const cached = await getCache(buildViewKey(view, scope, queryKey, version));
  if (cached === null) {
    return null;
  }

  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
};

export const setCachedProjectView = async (
  view: ProjectCacheView,
  scope: string,
  queryKey: string,
  payload: unknown
): Promise<void> => {
  const version = await getProjectListVersion();
  await setCache(buildViewKey(view, scope, queryKey, version), JSON.stringify(payload), PROJECT_LIST_TTL_SECONDS);
};

export const getCachedProjectList = <T>(scope: string, queryKey: string): Promise<T | null> =>
  getCachedProjectView<T>('list', scope, queryKey);

export const setCachedProjectList = (scope: string, queryKey: string, payload: unknown): Promise<void> =>
  setCachedProjectView('list', scope, queryKey, payload);

export const invalidateProjectListCache = async (): Promise<void> => {
  const current = parseInt(await getProjectListVersion(), 10) || 0;
  await setCache(VERSION_KEY, String(current + 1), VERSION_TTL_SECONDS);
};
