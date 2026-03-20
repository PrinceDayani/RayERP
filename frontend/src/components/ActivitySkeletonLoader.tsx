import { Card, CardContent } from '@/components/ui/card';

export function ActivitySkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card border border-border animate-pulse">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
