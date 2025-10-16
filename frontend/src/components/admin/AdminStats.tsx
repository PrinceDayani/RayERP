"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { UsersIcon, Settings2Icon, ActivityIcon, AlertTriangleIcon } from "lucide-react";
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
        // Using the adminAPI from the updated import
        const data = await adminAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        // Use mock data if API fails
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-28" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} currently active
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Settings2Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-28" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {stats.pendingApprovals > 0 ? "Requires attention" : "No pending approvals"}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">User Activity</CardTitle>
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-28" />
          ) : (
            <p className="text-xs text-muted-foreground">
              Of users active today
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
          <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.systemAlerts}</div>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-28" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {stats.systemAlerts > 0 ? "Requires attention" : "All systems normal"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}