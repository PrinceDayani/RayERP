import { useMemo } from 'react';

interface AccessLevelItem {
  isBasicView?: boolean;
}

export function useAccessLevel<T extends AccessLevelItem>(items: T[]) {
  return useMemo(() => {
    const basicViewItems = items.filter(item => item.isBasicView);
    const fullAccessItems = items.filter(item => !item.isBasicView);
    
    return {
      hasBasicViewItems: basicViewItems.length > 0,
      hasFullAccessItems: fullAccessItems.length > 0,
      basicViewCount: basicViewItems.length,
      fullAccessCount: fullAccessItems.length,
      totalCount: items.length,
      basicViewItems,
      fullAccessItems
    };
  }, [items]);
}

export function useProjectAccessLevel(projects: any[]) {
  return useAccessLevel(projects);
}

export function useTaskAccessLevel(tasks: any[]) {
  return useAccessLevel(tasks);
}