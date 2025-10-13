"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import Layout from "../Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { analyticsApi, ApiError } from "@/lib/api";

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

  if (error && !isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-500">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{error}</p>
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <div className="flex items-center gap-2">
              <DateRangePicker value={dateRange} onChange={handleDateChange} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Productivity</CardTitle>
                  <CardDescription>Attendance rate today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : `${summaryStats.employeeProductivity.toFixed(1)}%`}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Completion</CardTitle>
                  <CardDescription>Overall completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : `${summaryStats.projectCompletionRate.toFixed(1)}%`}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion</CardTitle>
                  <CardDescription>Overall task completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : `${summaryStats.taskCompletionRate.toFixed(1)}%`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="employees" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.employeeMetrics.total}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.employeeMetrics.active}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Today's Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.employeeMetrics.attendanceToday}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.projectMetrics.total}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.projectMetrics.active}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Completed Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.projectMetrics.completed}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.taskMetrics.total}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.taskMetrics.completed}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "Loading..." : analyticsData.taskMetrics.pending}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
}