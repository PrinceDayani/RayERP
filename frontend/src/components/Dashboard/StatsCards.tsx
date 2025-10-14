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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`bg-card shadow-theme-light hover:shadow-theme-medium overflow-hidden transition-all ${card.span || ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-theme-secondary">
            <CardTitle className="text-sm font-medium text-theme-primary">{card.title}</CardTitle>
            <Badge variant={card.badgeVariant} className="text-xs">
              {card.title.split(' ')[0]}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className={`text-2xl font-bold ${!isAuthenticated ? "text-theme-secondary" : "text-theme-heading"}`}>
                {card.value}
              </div>
            )}
            {isAuthenticated && !loading && (
              <div className="mt-1 flex items-center text-xs text-theme-secondary">
                {card.trend && (
                  <span className={`flex items-center mr-2 ${card.trendColorClass}`}>
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    {card.trend}
                  </span>
                )}
                {card.description}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;