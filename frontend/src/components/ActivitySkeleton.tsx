"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivitySkeleton() {
  return (
    <Card className="bg-card border border-border overflow-hidden">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Icon skeleton */}
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Title skeleton */}
                <Skeleton className="h-5 w-3/4" />
                
                {/* Details skeleton */}
                <Skeleton className="h-4 w-full" />
                
                {/* Badges skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-3">
                {/* Time skeleton */}
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
                
                {/* Button skeleton */}
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivitySkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ActivitySkeleton key={i} />
      ))}
    </div>
  );
}
