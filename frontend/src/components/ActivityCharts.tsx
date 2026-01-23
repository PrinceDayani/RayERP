'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface ActivityStats {
  resourceTypeStats: { _id: string; count: number }[];
  actionStats: { _id: string; count: number }[];
}

interface ActivityChartsProps {
  stats: ActivityStats;
}

export function ActivityCharts({ stats }: ActivityChartsProps) {
  const maxResourceCount = Math.max(...stats.resourceTypeStats.map(s => s.count), 1);
  const maxActionCount = Math.max(...stats.actionStats.map(s => s.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Activity by Resource Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.resourceTypeStats.slice(0, 8).map((stat) => (
              <div key={stat._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{stat._id}</span>
                  <span className="text-muted-foreground">{stat.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                    style={{ width: `${(stat.count / maxResourceCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-primary" />
            Activity by Action Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.actionStats.slice(0, 8).map((stat) => (
              <div key={stat._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{stat._id}</span>
                  <span className="text-muted-foreground">{stat.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                    style={{ width: `${(stat.count / maxActionCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
