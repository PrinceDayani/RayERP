"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from "./DashboardHeader";
import StatsCards from "./StatsCards";
import AnalyticsCharts from "./AnalyticsCharts";
import QuickActions from "./QuickActions";
import api from "@/lib/api/api";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/analytics"),
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader
        user={user}
        isAuthenticated={isAuthenticated}
        socketConnected={socketConnected}
        refreshData={fetchData}
      />
      {stats && (
        <StatsCards
          stats={stats}
          isAuthenticated={isAuthenticated}
          loading={false}
          router={router}
        />
      )}
      {analytics && (
        <AnalyticsCharts
          monthlyRevenue={analytics.monthlyRevenue}
          taskDistribution={analytics.taskDistribution}
          teamProductivity={analytics.teamProductivity}
        />
      )}
      <QuickActions isAuthenticated={isAuthenticated} router={router} />
    </div>
  );
}
