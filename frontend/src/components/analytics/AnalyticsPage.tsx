"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, FolderKanban, CheckSquare, TrendingUp, Activity, Target } from "lucide-react";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { analyticsApi } from "@/lib/api";
// ApiError class for analytics errors
class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

interface EmployeeMetrics {
  total: number;
  active: number;
  attendanceToday: number;
}

interface ProjectMetrics {
  total: number;
  active: number;
  completed: number;
}

interface TaskMetrics {
  total: number;
  completed: number;
  pending: number;
}

interface AnalyticsData {
  employeeMetrics: EmployeeMetrics;
  projectMetrics: ProjectMetrics;
  taskMetrics: TaskMetrics;
}

interface DateRange {
  from: Date;
  to: Date;
}

export default function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    employeeMetrics: { total: 0, active: 0, attendanceToday: 0 },
    projectMetrics: { total: 0, active: 0, completed: 0 },
    taskMetrics: { total: 0, completed: 0, pending: 0 }
  });
  
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    to: new Date() 
  });

  const checkAuth = useCallback(async () => {
    try {
      await analyticsApi.checkAuth();
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error("Auth check error:", err);
      setIsAuthenticated(false);
      
      if (err instanceof ApiError) {
        switch (err.code) {
          case 'UNAUTHORIZED':
            setError("Authentication required. Please log in to access analytics.");
            break;
          case 'TIMEOUT':
            setError("Request timeout. Please check your connection and try again.");
            break;
          case 'NETWORK_ERROR':
            setError("Network error. Please check your connection.");
            break;
          default:
            setError("Unable to verify authentication. Please refresh the page.");
        }
      } else {
        setError("An unexpected error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dashboardData = await analyticsApi.getDashboardAnalytics();
      
      setAnalyticsData({
        employeeMetrics: (dashboardData as any)?.data?.employeeMetrics || { total: 0, active: 0, attendanceToday: 0 },
        projectMetrics: (dashboardData as any)?.data?.projectMetrics || { total: 0, active: 0, completed: 0 },
        taskMetrics: (dashboardData as any)?.data?.taskMetrics || { total: 0, completed: 0, pending: 0 }
      });
      
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      
      if (err instanceof ApiError) {
        if (err.code === 'UNAUTHORIZED') {
          setIsAuthenticated(false);
          setError("Session expired. Please log in again.");
        } else {
          setError(`Failed to load analytics data: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred while loading data.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleDateChange = useCallback((value: { from: Date | undefined; to?: Date | undefined }) => {
    if (value.from) {
      setDateRange({ 
        from: value.from, 
        to: value.to || new Date()
      });
    }
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    if (isAuthenticated) {
      fetchAnalyticsData();
    } else {
      checkAuth();
    }
  }, [isAuthenticated, fetchAnalyticsData, checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, isAuthenticated]);

  const summaryStats = useMemo(() => {
    const employeeProductivity = analyticsData.employeeMetrics.active > 0 
      ? (analyticsData.employeeMetrics.attendanceToday / analyticsData.employeeMetrics.active) * 100 
      : 0;
    const projectCompletionRate = analyticsData.projectMetrics.total > 0 
      ? (analyticsData.projectMetrics.completed / analyticsData.projectMetrics.total) * 100 
      : 0;
    const taskCompletionRate = analyticsData.taskMetrics.total > 0 
      ? (analyticsData.taskMetrics.completed / analyticsData.taskMetrics.total) * 100 
      : 0;
    
    return {
      employeeProductivity,
      projectCompletionRate,
      taskCompletionRate
    };
  }, [analyticsData]);

  const StatCard = ({ icon: Icon, label, value, trend, color = "blue" }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{loading ? "..." : value}</p>
            {trend !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-50`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (error && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-500">Authentication Required</h3>
            <p className="text-sm">{error}</p>
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Comprehensive project insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={handleDateChange} />
            <Button variant="outline" size="icon" onClick={handleRetry} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>Retry</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard 
            icon={TrendingUp} 
            label="Employee Productivity" 
            value={`${summaryStats.employeeProductivity.toFixed(1)}%`}
            trend="Attendance rate today"
            color="blue"
          />
          <StatCard 
            icon={Target} 
            label="Project Completion" 
            value={`${summaryStats.projectCompletionRate.toFixed(1)}%`}
            trend="Overall completion rate"
            color="green"
          />
          <StatCard 
            icon={Activity} 
            label="Task Completion" 
            value={`${summaryStats.taskCompletionRate.toFixed(1)}%`}
            trend="Overall task rate"
            color="purple"
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Employees */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Employees</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.employeeMetrics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.employeeMetrics.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Present Today</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.employeeMetrics.attendanceToday}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Projects</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.projectMetrics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.projectMetrics.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.projectMetrics.completed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Tasks</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.taskMetrics.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.taskMetrics.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold">{loading ? "..." : analyticsData.taskMetrics.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}