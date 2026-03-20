"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Activity as ActivityIconLucide } from 'lucide-react';
import { ActivityStats as ActivityStatsType } from '@/types/activity';

interface ActivityStatsProps {
  stats: ActivityStatsType;
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-3xl font-bold mb-2 text-foreground">{stats.totalActivities}</h3>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
      
      <Card className="bg-card border border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-muted-foreground">Today</p>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-3xl font-bold mb-2 text-foreground">{stats.todayActivities}</h3>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>
      
      <Card className="bg-card border border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-muted-foreground">This Week</p>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-3xl font-bold mb-2 text-foreground">{stats.weekActivities}</h3>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>
      
      <Card className="bg-card border border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-medium text-muted-foreground">This Month</p>
            <ActivityIconLucide className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-3xl font-bold mb-2 text-foreground">{stats.monthActivities}</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
