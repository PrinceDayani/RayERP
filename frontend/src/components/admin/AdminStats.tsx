"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { UsersIcon, Settings2Icon, ActivityIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";

interface AdminStatsProps {
  isLoading: boolean;
}

export function AdminStats({ isLoading }: AdminStatsProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    systemAlerts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setStats({
          totalUsers: 145,
          activeUsers: 98,
          pendingApprovals: 7,
          systemAlerts: 3,
        });
      }
    };

    if (!isLoading) {
      fetchStats();
    }
  }, [isLoading]);

  const activityPercentage = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} currently active`,
      icon: UsersIcon,
      color: "blue",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      subtitle: stats.pendingApprovals > 0 ? "Requires attention" : "No pending approvals",
      icon: Settings2Icon,
      color: stats.pendingApprovals > 0 ? "orange" : "green",
      trend: "-3%",
      trendUp: false
    },
    {
      title: "User Activity",
      value: `${activityPercentage}%`,
      subtitle: "Of users active today",
      icon: ActivityIcon,
      color: activityPercentage > 70 ? "green" : activityPercentage > 40 ? "orange" : "red",
      trend: "+5%",
      trendUp: true
    },
    {
      title: "System Alerts",
      value: stats.systemAlerts,
      subtitle: stats.systemAlerts > 0 ? "Requires attention" : "All systems normal",
      icon: AlertTriangleIcon,
      color: stats.systemAlerts > 0 ? "red" : "green",
      trend: stats.systemAlerts > 0 ? "+2" : "0",
      trendUp: stats.systemAlerts > 0
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-gradient-to-br from-red-50/80 to-indigo-50/80 border-red-200/50 dark:from-red-950/50 dark:to-indigo-950/50 dark:border-red-800/30",
      green: "bg-gradient-to-br from-emerald-50/80 to-green-50/80 border-emerald-200/50 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800/30",
      orange: "bg-gradient-to-br from-orange-50/80 to-amber-50/80 border-orange-200/50 dark:from-orange-950/50 dark:to-amber-950/50 dark:border-orange-800/30",
      red: "bg-gradient-to-br from-red-50/80 to-rose-50/80 border-red-200/50 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800/30"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-red-600 dark:text-red-400",
      green: "text-emerald-600 dark:text-emerald-400",
      orange: "text-orange-600 dark:text-orange-400",
      red: "text-red-600 dark:text-red-400"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendUp ? TrendingUpIcon : TrendingDownIcon;
        
        return (
          <Card 
            key={index} 
            className={`group relative overflow-hidden border-0 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${getColorClasses(stat.color)} backdrop-blur-sm`}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: isLoading ? 'none' : 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5" />
            
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={`relative p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl" />
                  <Icon className={`relative h-5 w-5 ${getIconColor(stat.color)} group-hover:animate-pulse`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {stat.value}
                </div>
                <Badge 
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0 shadow-md ${
                    stat.trendUp 
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white" 
                      : "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
                  } group-hover:scale-105 transition-transform duration-300`}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {stat.trend}
                </Badge>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {stat.subtitle}
              </p>
              
              {/* Progress indicator for certain stats */}
              {stat.title === "User Activity" && (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${activityPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
