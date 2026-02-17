"use client";

import React, { useState, useEffect, memo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, TrendingUp, ShieldCheck, UserCog, RefreshCw, Wifi, WifiOff,
  Briefcase, CheckSquare, Activity, Clock, Target, Calendar, TrendingDown,
  ArrowUpRight, Plus
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { formatINR } from "@/lib/currency";
import { employeesAPI } from "@/lib/api/employeesAPI";
import { projectsAPI } from "@/lib/api/projectsAPI";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { trendsAPI, TrendsResponse } from "@/lib/api/trendsAPI";
import { analyticsAPI } from "@/lib/api/analyticsAPI";

const AnalyticsCharts = lazy(() => import('@/components/Dashboard/AnalyticsCharts'));
const EmployeeList = lazy(() => import('@/components/employee').then(m => ({ default: m.EmployeeList })));
const ProjectList = lazy(() => import('@/components/projects').then(m => ({ default: m.ProjectList })));
const TaskList = lazy(() => import('@/components/tasks').then(m => ({ default: m.TaskList })));

interface AnalyticsData {
  projectProgress: Array<{ name: string; progress: number; status: string }>;
  taskDistribution: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; time: string }>;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueView, setRevenueView] = useState<'sales' | 'projects'>('sales');
  const { stats, loading: dataLoading, socketConnected, refresh } = useDashboardData(isAuthenticated);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    projectProgress: [], taskDistribution: [], monthlyRevenue: [],
    teamProductivity: [], recentActivity: []
  });
  const [trends, setTrends] = useState<TrendsResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      const [analyticsData, trendsData] = await Promise.allSettled([
        analyticsAPI.getAnalytics().catch(() => null),
        trendsAPI.getTrends().catch(() => null)
      ]);
      if (analyticsData.status === 'fulfilled' && analyticsData.value) {
        setAnalytics({
          projectProgress: analyticsData.value.projectProgress || [],
          taskDistribution: analyticsData.value.taskDistribution || [],
          monthlyRevenue: analyticsData.value.monthlyRevenue || [],
          teamProductivity: analyticsData.value.teamProductivity || [],
          recentActivity: analyticsData.value.recentActivity || []
        });
      }
      if (trendsData.status === 'fulfilled' && trendsData.value) setTrends(trendsData.value);
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;
    const handleActivity = (activity: any) => {
      setAnalytics(prev => ({
        ...prev,
        recentActivity: [{
          id: activity.id || Date.now().toString(),
          type: activity.type || 'system',
          description: activity.message || activity.description,
          time: new Date(activity.timestamp).toLocaleString()
        }, ...prev.recentActivity.slice(0, 19)]
      }));
    };
    socket.on('activity_log', handleActivity);
    return () => { socket.off('activity_log', handleActivity); };
  }, [isAuthenticated]);

  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header with Role Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card rounded-lg p-6 border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.name}!
              </h1>
              {userRole === UserRole.ROOT && (
                <Badge className="bg-primary text-primary-foreground">
                  <ShieldCheck className="h-3 w-3 mr-1" />ROOT
                </Badge>
              )}
              {userRole === UserRole.SUPER_ADMIN && (
                <Badge className="bg-primary text-primary-foreground">
                  <ShieldCheck className="h-3 w-3 mr-1" />SUPER ADMIN
                </Badge>
              )}
              {userRole === UserRole.ADMIN && (
                <Badge className="bg-primary text-primary-foreground">
                  <UserCog className="h-3 w-3 mr-1" />ADMIN
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Here's your business overview for today</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={socketConnected ? "default" : "secondary"} className="gap-1.5 px-3 py-1.5">
              {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {socketConnected ? 'Live Updates' : 'Polling Mode'}
            </Badge>
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Employees
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Employees" value={stats.totalEmployees} subtitle={`${stats.activeEmployees} active`} icon={Users} trend={trends?.employees} loading={dataLoading} color="blue" />
              <StatCard title="Projects" value={stats.totalProjects} subtitle={`${stats.completedProjects} completed`} icon={Briefcase} trend={trends?.projects} loading={dataLoading} color="purple" />
              <StatCard title="Tasks" value={stats.totalTasks} subtitle={`${stats.completedTasks} done`} icon={CheckSquare} loading={dataLoading} color="green" />
              <StatCard title="Progress" value={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`} subtitle="Completion rate" icon={Target} loading={dataLoading} color="orange" />
            </div>

            {/* Financial Overview with Toggle */}
            <Card className="bg-card border border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={revenueView === 'sales' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('sales')}
                    className={revenueView === 'sales' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Sales Revenue
                  </Button>
                  <Button
                    variant={revenueView === 'projects' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('projects')}
                    className={revenueView === 'projects' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Project Budgets
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {revenueView === 'sales' ? (
                    <>
                      <FinanceCard title="Sales Revenue" value={formatINR(stats.salesRevenue || 0)} subtitle={`${stats.salesCount || 0} invoices`} icon={TrendingUp} color="green" />
                      <FinanceCard title="Amount Received" value={formatINR(stats.salesPaid || 0)} subtitle={`${stats.salesRevenue > 0 ? ((stats.salesPaid / stats.salesRevenue) * 100).toFixed(1) : '0'}% collected`} icon={Calendar} color="blue" />
                      <FinanceCard title="Pending Amount" value={formatINR(stats.salesPending || 0)} subtitle={`${stats.salesRevenue > 0 ? ((stats.salesPending / stats.salesRevenue) * 100).toFixed(1) : '0'}% pending`} icon={Clock} color="orange" />
                    </>
                  ) : (
                    <>
                      <FinanceCard title="Project Revenue" value={formatINR(stats.projectRevenue || 0)} subtitle={`${stats.totalProjects || 0} projects`} icon={Briefcase} color="purple" />
                      <FinanceCard title="Project Expenses" value={formatINR(stats.projectExpenses || 0)} subtitle="Spent budget" icon={TrendingDown} color="red" />
                      <FinanceCard title="Project Profit" value={formatINR(stats.projectProfit || 0)} subtitle="Budget - Spent" icon={Target} color="green" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
              <AnalyticsCharts
                monthlyRevenue={analytics.monthlyRevenue}
                taskDistribution={analytics.taskDistribution}
                teamProductivity={analytics.teamProductivity}
              />
            </Suspense>

            {/* Projects & Activity */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-slate-800 dark:to-slate-800/80 border border-stone-200/50 dark:border-slate-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.2),-4px_-4px_12px_rgba(255,255,255,0.01)]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold text-stone-900 dark:text-slate-100">
                    <Briefcase className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                    Active Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.projectProgress?.length > 0 ? analytics.projectProgress.slice(0, 5).map((project, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-xl bg-gradient-to-br from-stone-50 to-white dark:from-slate-700 dark:to-slate-700/80 hover:from-stone-100 hover:to-stone-50 dark:hover:from-slate-600 dark:hover:to-slate-600/80 transition-all border border-stone-200/50 dark:border-slate-600/50 shadow-[3px_3px_6px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.02)]">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate text-stone-700 dark:text-slate-200">{project.name}</span>
                        <Badge className="bg-gradient-to-br from-rose-700 to-rose-800 text-white shadow-[2px_2px_4px_rgba(136,19,55,0.3)]">{project.progress}%</Badge>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-16 w-16 mx-auto mb-4 text-stone-300 dark:text-stone-700" />
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">No active projects</p>
                      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects/create')} className="border-stone-300 dark:border-stone-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-slate-800 dark:to-slate-800/80 border border-stone-200/50 dark:border-slate-700/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.2),-4px_-4px_12px_rgba(255,255,255,0.01)]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold text-stone-900 dark:text-slate-100">
                    <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.recentActivity?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-3 rounded-xl bg-gradient-to-br from-stone-50 to-white dark:from-slate-700 dark:to-slate-700/80 hover:from-stone-100 hover:to-stone-50 dark:hover:from-slate-600 dark:hover:to-slate-600/80 transition-all border border-stone-200/50 dark:border-slate-600/50 shadow-[3px_3px_6px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.02)]">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/30 flex items-center justify-center flex-shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.02)]">
                            {activity.type === 'project' && <Briefcase className="h-4 w-4 text-rose-700 dark:text-rose-300" />}
                            {activity.type === 'task' && <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
                            {activity.type === 'employee' && <Users className="h-4 w-4 text-amber-600 dark:text-amber-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-stone-700 dark:text-slate-200">{activity.description}</p>
                            <p className="text-xs text-stone-500 dark:text-slate-400">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-stone-300 dark:text-stone-700" />
                      <p className="text-sm text-stone-600 dark:text-stone-400">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <EmployeeSection router={router} />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <ProjectSection router={router} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <TaskSection router={router} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = memo(({ title, value, subtitle, icon: Icon, trend, loading, color }: any) => {
  const colorClasses = {
    blue: 'bg-card border border-border',
    purple: 'bg-card border border-border',
    green: 'bg-card border border-border',
    orange: 'bg-card border border-border'
  };

  return (
    <Card className={`${colorClasses[color]} hover:border-primary/50 transition-colors`}>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <Icon className="h-5 w-5 text-stone-500 dark:text-slate-400" />
            </div>
            <h3 className="text-3xl font-bold mb-2 text-foreground">{value}</h3>
            <div className="flex items-center gap-2">
              {trend && (
                <Badge className={`text-xs gap-1 ${trend.direction === 'up' ? 'bg-emerald-600 text-white' : 'bg-stone-400 dark:bg-stone-600 text-white'}`}>
                  <ArrowUpRight className={`h-3 w-3 ${trend.direction === 'down' ? 'rotate-90' : ''}`} />
                  {trend.value}%
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
StatCard.displayName = 'StatCard';

const FinanceCard = memo(({ title, value, subtitle, icon: Icon, color }: any) => {
  const colorClasses = {
    green: 'border-l-green-500 bg-card',
    blue: 'border-l-blue-500 bg-card',
    orange: 'border-l-orange-500 bg-card',
    purple: 'border-l-purple-500 bg-card',
    red: 'border-l-red-500 bg-card'
  };

  const iconColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  return (
    <div className={`border-l-4 rounded-lg p-5 ${colorClasses[color]} hover:border-primary/50 transition-colors`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-2xl font-bold mb-1 text-foreground">{value}</h3>
          <p className="text-xs text-stone-600 dark:text-slate-400">{subtitle}</p>
        </div>
        <Icon className={`h-9 w-9 ${iconColors[color]}`} />
      </div>
    </div>
  );
});
FinanceCard.displayName = 'FinanceCard';

const EmployeeSection = ({ router }: { router: any }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesAPI.getAll();
        setEmployees((data.data || data).slice(0, 10));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Button onClick={() => router.push("/dashboard/employees")}>
          View All Employees
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{employees.length}</h3>
              </div>
              <Users className="h-10 w-10 text-rose-700 dark:text-rose-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Active</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{employees.filter(e => e.status === 'active').length}</h3>
              </div>
              <Activity className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Departments</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">
                  {new Set(employees.flatMap(e => e.departments?.length > 0 ? e.departments : e.department ? [e.department] : [])).size}
                </h3>
              </div>
              <Briefcase className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
        <CardHeader>
          <CardTitle className="font-semibold text-stone-900 dark:text-white">Recent Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <EmployeeList employees={employees} onEdit={(id) => router.push(`/dashboard/employees/${id}/edit`)} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

const ProjectSection = ({ router }: { router: any }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getAll();
        setProjects((data.data || data).slice(0, 10));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button onClick={() => router.push("/dashboard/projects")}>
          View All Projects
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{projects.length}</h3>
              </div>
              <Briefcase className="h-10 w-10 text-rose-700 dark:text-rose-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Active</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{projects.filter(p => p.status === 'active').length}</h3>
              </div>
              <Activity className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Avg Progress</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">
                  {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0}%
                </h3>
              </div>
              <Target className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
        <CardHeader>
          <CardTitle className="font-semibold text-stone-900 dark:text-white">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <ProjectList projects={projects} onView={(id) => router.push(`/dashboard/projects/${id}`)} onEdit={(id) => router.push(`/dashboard/projects/${id}/edit`)} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

const TaskSection = ({ router }: { router: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksAPI.getAll();
        setTasks((data.data || data).slice(0, 10));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <Button onClick={() => router.push("/dashboard/tasks")}>
          View All Tasks
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{tasks.length}</h3>
              </div>
              <CheckSquare className="h-10 w-10 text-rose-700 dark:text-rose-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Completed</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{tasks.filter(t => t.status === 'completed').length}</h3>
              </div>
              <Activity className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">In Progress</p>
                <h3 className="text-3xl font-bold text-stone-900 dark:text-white">{tasks.filter(t => t.status === 'in-progress').length}</h3>
              </div>
              <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 border border-stone-200/50 dark:border-stone-800/50 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02)]">
        <CardHeader>
          <CardTitle className="font-semibold text-stone-900 dark:text-white">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TaskList tasks={tasks} onView={(id) => router.push(`/dashboard/tasks/${id}`)} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
