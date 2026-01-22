//project\frontend\src\components\Dashboard\StatsCards.tsx
"use client";

import React, { memo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Eye, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface StatsCardsProps {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
  };
  trends?: {
    employees?: { value: number; direction: 'up' | 'down' };
    projects?: { value: number; direction: 'up' | 'down' };
  };
  isAuthenticated: boolean;
  loading: boolean;
  router?: any;
}

const StatsCards: React.FC<StatsCardsProps> = memo(({ stats, trends, isAuthenticated, loading, router }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading, stats]);

  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
      if (seconds < 60) setTimeAgo('Just now');
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatNumber = (value: number) => {
    try {
      if (typeof value !== 'number' || isNaN(value)) {
        return '0';
      }
      return new Intl.NumberFormat('en-US').format(value);
    } catch (error) {
      console.warn('Number formatting failed:', error instanceof Error ? error.message : 'Unknown error');
      return '0';
    }
  };

  const cards = [
    {
      title: "Total Employees",
      value: formatNumber(stats.totalEmployees),
      trend: trends?.employees ? `${trends.employees.direction === 'up' ? '+' : '-'}${trends.employees.value}%` : undefined,
      description: "from last period",
      trendColorClass: trends?.employees?.direction === 'up' ? "text-theme-success" : "text-red-600",
      badgeVariant: "default" as const,
      viewLink: "/dashboard/employees"
    },
    {
      title: "Active Employees",
      value: formatNumber(stats.activeEmployees),
      description: "Currently working",
      trendColorClass: "text-theme-success",
      badgeVariant: "secondary" as const,
      viewLink: "/dashboard/employees"
    },
    {
      title: "Total Projects",
      value: formatNumber(stats.totalProjects),
      trend: trends?.projects ? `${trends.projects.direction === 'up' ? '+' : '-'}${trends.projects.value}%` : undefined,
      description: "from last period",
      trendColorClass: trends?.projects?.direction === 'up' ? "text-theme-success" : "text-red-600",
      badgeVariant: "outline" as const,
      viewLink: "/dashboard/projects"
    },
    {
      title: "Completed Projects",
      value: formatNumber(stats.completedProjects),
      description: "Successfully finished",
      trendColorClass: "text-theme-success",
      badgeVariant: "default" as const,
      viewLink: "/dashboard/projects"
    },
    {
      title: "Total Tasks",
      value: formatNumber(stats.totalTasks),
      description: "Across all projects",
      trendColorClass: "",
      span: "md:col-span-1 lg:col-span-2",
      badgeVariant: "secondary" as const,
      viewLink: "/dashboard/tasks"
    },
    {
      title: "Completed Tasks",
      value: formatNumber(stats.completedTasks),
      description: "Task completion rate",
      trendColorClass: "text-theme-success",
      span: "md:col-span-1 lg:col-span-2",
      badgeVariant: "default" as const,
      viewLink: "/dashboard/tasks"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Key Metrics</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {timeAgo}</span>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card 
            key={index} 
            className={`bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden group ${card.span || ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{card.title}</CardTitle>
              {isAuthenticated && !loading && router && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => router.push(card.viewLink)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {card.value}
                  </div>
                  <div className="flex items-center text-sm">
                    {card.trend && (
                      <span className="flex items-center text-green-600 font-medium mr-2">
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                        {card.trend}
                      </span>
                    )}
                    <span className="text-muted-foreground">{card.description}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default StatsCards;
