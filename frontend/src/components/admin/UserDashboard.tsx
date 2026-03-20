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
const EmployeeList = lazy(() => import('@/components/employee/EmployeeList'));
const ProjectList = lazy(() => import('@/components/projects/ProjectList'));
const TaskList = lazy(() => import('@/components/tasks/TaskList'));

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
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      setAnalyticsLoading(true);
      try {
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
        if (trendsData.status === 'fulfilled' && trendsData.value) {
          setTrends(trendsData.value);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;
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
      <div className="container-responsive py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Header with Role Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {user?.name}!
              </h1>
              {userRole === UserRole.ROOT && (
                <Badge className="bg-burgundy-600 text-white border-0">
                  <ShieldCheck className="h-3 w-3 mr-1" />ROOT
                </Badge>
              )}
              {userRole === UserRole.SUPER_ADMIN && (
                <Badge className="bg-burgundy-600 text-white border-0">
                  <ShieldCheck className="h-3 w-3 mr-1" />SUPER ADMIN
                </Badge>
              )}
              {userRole === UserRole.ADMIN && (
                <Badge className="bg-burgundy-600 text-white border-0">
                  <UserCog className="h-3 w-3 mr-1" />ADMIN
                </Badge>
              )}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Here's your business overview for today</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={socketConnected ? "default" : "secondary"} className="gap-1.5 px-3 py-1.5">
              {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{socketConnected ? 'Live Updates' : 'Polling Mode'}</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-12 bg-muted p-1 rounded-lg gap-1">
            <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-burgundy-600 data-[state=active]:text-white transition-all">
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-burgundy-600 data-[state=active]:text-white transition-all">
              Employees
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-md data-[state=active]:bg-burgundy-600 data-[state=active]:text-white transition-all">
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-burgundy-600 data-[state=active]:text-white transition-all">
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Employees" value={stats.totalEmployees} subtitle={`${stats.activeEmployees} active`} icon={Users} trend={trends?.employees} loading={dataLoading} />
              <StatCard title="Projects" value={stats.totalProjects} subtitle={`${stats.completedProjects} completed`} icon={Briefcase} trend={trends?.projects} loading={dataLoading} />
              <StatCard title="Tasks" value={stats.totalTasks} subtitle={`${stats.completedTasks} done`} icon={CheckSquare} loading={dataLoading} />
              <StatCard title="Progress" value={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`} subtitle="Completion rate" icon={Target} loading={dataLoading} />
            </div>

            {/* Financial Overview with Toggle */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 space-y-2 sm:space-y-0">
                <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={revenueView === 'sales' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('sales')}
                    className={revenueView === 'sales' ? 'bg-burgundy-600 hover:bg-burgundy-700 text-white border-0' : ''}
                  >
                    Sales
                  </Button>
                  <Button
                    variant={revenueView === 'projects' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('projects')}
                    className={revenueView === 'projects' ? 'bg-burgundy-600 hover:bg-burgundy-700 text-white border-0' : ''}
                  >
                    Projects
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {revenueView === 'sales' ? (
                    <>
                      <FinanceCard title="Sales Revenue" value={formatINR(stats.salesRevenue || 0)} subtitle={`${stats.salesCount || 0} invoices`} icon={TrendingUp} color="success" />
                      <FinanceCard title="Amount Received" value={formatINR(stats.salesPaid || 0)} subtitle={`${stats.salesRevenue > 0 ? ((stats.salesPaid / stats.salesRevenue) * 100).toFixed(1) : '0'}% collected`} icon={Calendar} color="info" />
                      <FinanceCard title="Pending Amount" value={formatINR(stats.salesPending || 0)} subtitle={`${stats.salesRevenue > 0 ? ((stats.salesPending / stats.salesRevenue) * 100).toFixed(1) : '0'}% pending`} icon={Clock} color="warning" />
                    </>
                  ) : (
                    <>
                      <FinanceCard title="Project Revenue" value={formatINR(stats.projectRevenue || 0)} subtitle={`${stats.totalProjects || 0} projects`} icon={Briefcase} color="primary" />
                      <FinanceCard title="Project Expenses" value={formatINR(stats.projectExpenses || 0)} subtitle="Spent budget" icon={TrendingDown} color="destructive" />
                      <FinanceCard title="Project Profit" value={formatINR(stats.projectProfit || 0)} subtitle="Budget - Spent" icon={Target} color="success" />
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
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold">
                    <Briefcase className="h-5 w-5 text-burgundy-600" />
                    Active Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.projectProgress?.length > 0 ? analytics.projectProgress.slice(0, 3).map((project, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate">{project.name}</span>
                        <Badge className="bg-burgundy-600 text-white border-0">{project.progress}%</Badge>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground mb-3">No active projects</p>
                      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects/create')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold">
                    <Activity className="h-5 w-5 text-burgundy-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.recentActivity?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.recentActivity.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border">
                          <div className="h-9 w-9 rounded-full bg-burgundy-100 dark:bg-burgundy-900/30 flex items-center justify-center flex-shrink-0">
                            {activity.type === 'project' && <Briefcase className="h-4 w-4 text-burgundy-600" />}
                            {activity.type === 'task' && <CheckSquare className="h-4 w-4 text-burgundy-600" />}
                            {activity.type === 'employee' && <Users className="h-4 w-4 text-burgundy-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
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

const StatCard = memo(({ title, value, subtitle, icon: Icon, trend, loading }: any) => {
  return (
    <Card className="bg-card border border-border hover:border-burgundy-500/50 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardContent className="p-4 md:p-6">
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
              <Icon className="h-5 w-5 text-burgundy-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">{value}</h3>
            <div className="flex items-center gap-2">
              {trend && (
                <Badge className={`text-xs gap-1 border-0 ${trend.direction === 'up' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
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
    success: 'border-l-success',
    info: 'border-l-info',
    warning: 'border-l-warning',
    primary: 'border-l-primary',
    destructive: 'border-l-destructive'
  };

  const iconColors = {
    success: 'text-success',
    info: 'text-info',
    warning: 'text-warning',
    primary: 'text-primary',
    destructive: 'text-destructive'
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 md:p-5 bg-card hover:shadow-md transition-all duration-200 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold mb-1 text-foreground truncate">{value}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Icon className={`h-8 w-8 md:h-9 md:w-9 flex-shrink-0 ${iconColors[color]}`} />
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <h3 className="text-2xl md:text-3xl font-bold">{employees.length}</h3>
              </div>
              <Users className="h-8 w-8 md:h-10 md:w-10 text-burgundy-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <h3 className="text-2xl md:text-3xl font-bold">{employees.filter(e => e.status === 'active').length}</h3>
              </div>
              <Activity className="h-8 w-8 md:h-10 md:w-10 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Departments</p>
                <h3 className="text-2xl md:text-3xl font-bold">
                  {new Set(employees.flatMap(e => e.departments?.length > 0 ? e.departments : e.department ? [e.department] : [])).size}
                </h3>
              </div>
              <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">Recent Employees</CardTitle>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <h3 className="text-2xl md:text-3xl font-bold">{projects.length}</h3>
              </div>
              <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-burgundy-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <h3 className="text-2xl md:text-3xl font-bold">{projects.filter(p => p.status === 'active').length}</h3>
              </div>
              <Activity className="h-8 w-8 md:h-10 md:w-10 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Progress</p>
                <h3 className="text-2xl md:text-3xl font-bold">
                  {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0}%
                </h3>
              </div>
              <Target className="h-8 w-8 md:h-10 md:w-10 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">Recent Projects</CardTitle>
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <h3 className="text-2xl md:text-3xl font-bold">{tasks.length}</h3>
              </div>
              <CheckSquare className="h-8 w-8 md:h-10 md:w-10 text-burgundy-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <h3 className="text-2xl md:text-3xl font-bold">{tasks.filter(t => t.status === 'completed').length}</h3>
              </div>
              <Activity className="h-8 w-8 md:h-10 md:w-10 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <h3 className="text-2xl md:text-3xl font-bold">{tasks.filter(t => t.status === 'in-progress').length}</h3>
              </div>
              <Clock className="h-8 w-8 md:h-10 md:w-10 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">Recent Tasks</CardTitle>
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
