//project\frontend\src\components\Dashboard\StatsCards.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
  };
  isAuthenticated: boolean;
  loading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isAuthenticated, loading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const cards = [
    {
      title: "Total Employees",
      value: formatNumber(stats.totalEmployees),
      trend: "+5.2%",
      description: "from last period",
      trendColorClass: "text-theme-success",
      badgeVariant: "default" as const
    },
    {
      title: "Active Employees",
      value: formatNumber(stats.activeEmployees),
      description: "Currently working",
      trendColorClass: "text-theme-success",
      badgeVariant: "secondary" as const
    },
    {
      title: "Total Projects",
      value: formatNumber(stats.totalProjects),
      trend: "+12.3%",
      description: "from last period",
      trendColorClass: "text-theme-success",
      badgeVariant: "outline" as const
    },
    {
      title: "Completed Projects",
      value: formatNumber(stats.completedProjects),
      description: "Successfully finished",
      trendColorClass: "text-theme-success",
      badgeVariant: "default" as const
    },
    {
      title: "Total Tasks",
      value: formatNumber(stats.totalTasks),
      description: "Across all projects",
      trendColorClass: "",
      span: "md:col-span-1 lg:col-span-2",
      badgeVariant: "secondary" as const
    },
    {
      title: "Completed Tasks",
      value: formatNumber(stats.completedTasks),
      description: "Task completion rate",
      trendColorClass: "text-theme-success",
      span: "md:col-span-1 lg:col-span-2",
      badgeVariant: "default" as const
    }
  ];

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden ${card.span || ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-2">
                {card.value}
              </div>
            )}
            {isAuthenticated && !loading && (
              <div className="flex items-center text-sm">
                {card.trend && (
                  <span className="flex items-center text-green-600 font-medium mr-2">
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    {card.trend}
                  </span>
                )}
                <span className="text-muted-foreground">{card.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;