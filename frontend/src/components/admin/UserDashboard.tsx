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
  ArrowUpRight, Plus, type LucideIcon
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { formatINR } from "@/lib/currency";
import { employeesAPI } from "@/lib/api/hr/employeesAPI";
import { projectsAPI } from "@/lib/api/projectsAPI";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { trendsAPI, TrendsResponse } from "@/lib/api/trendsAPI";
import { analyticsAPI } from "@/lib/api/analyticsAPI";

const AnalyticsCharts = lazy(() => import('@/components/Dashboard/AnalyticsCharts'));
const EmployeeList = lazy(() => import('@/components/hr/employee/EmployeeList'));
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
    <div className="container-responsive py-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Header: greeting, tabs and live status share one row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">
              Welcome back, {user?.name}
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
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="h-9 bg-muted p-1 rounded-lg">
              {(['overview', 'employees', 'projects', 'tasks'] as const).map(tab => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-md px-3 text-sm capitalize data-[state=active]:bg-burgundy-600 data-[state=active]:text-white transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <Badge variant={socketConnected ? "default" : "secondary"} className="gap-1.5 h-9 px-3">
              {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{socketConnected ? 'Live' : 'Polling'}</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2 h-9">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Key metrics: operations and finance in one strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Key metrics</h2>
                <div className="flex rounded-md border border-border p-0.5">
                  {(['sales', 'projects'] as const).map(view => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setRevenueView(view)}
                      className={`rounded px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${revenueView === view ? 'bg-burgundy-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
                <StatCard title="Employees" value={stats.totalEmployees} subtitle={`${stats.activeEmployees} active`} icon={Users} trend={trends?.employees} loading={dataLoading} />
                <StatCard title="Projects" value={stats.totalProjects} subtitle={`${stats.completedProjects} completed`} icon={Briefcase} trend={trends?.projects} loading={dataLoading} />
                <StatCard title="Tasks" value={stats.totalTasks} subtitle={`${stats.completedTasks} done`} icon={CheckSquare} loading={dataLoading} />
                <StatCard title="Progress" value={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`} subtitle="Completion rate" icon={Target} loading={dataLoading} />
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
            </div>

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
              <Card className="bg-card border border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 font-semibold">
                    <Briefcase className="h-4 w-4 text-burgundy-600" />
                    Active Projects
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => router.push('/dashboard/projects')}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {analytics.projectProgress?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {analytics.projectProgress.slice(0, 8).map((project, i) => (
                        <div key={i} className="flex items-center gap-3 py-2">
                          <span className="flex-1 min-w-0 truncate text-sm font-medium">{project.name}</span>
                          <Progress value={project.progress} className="h-1.5 w-24 shrink-0" />
                          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm text-muted-foreground">No active projects</p>
                      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects/create')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 font-semibold">
                    <Activity className="h-4 w-4 text-burgundy-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {analytics.recentActivity?.length > 0 ? (
                    <div className="divide-y divide-border">
                      {analytics.recentActivity.slice(0, 8).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 py-2">
                          <div className="h-7 w-7 rounded-full bg-burgundy-100 dark:bg-burgundy-900/30 flex items-center justify-center flex-shrink-0">
                            {activity.type === 'project' && <Briefcase className="h-3.5 w-3.5 text-burgundy-600" />}
                            {activity.type === 'task' && <CheckSquare className="h-3.5 w-3.5 text-burgundy-600" />}
                            {activity.type === 'employee' && <Users className="h-3.5 w-3.5 text-burgundy-600" />}
                          </div>
                          <p className="flex-1 min-w-0 truncate text-sm">{activity.description}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-3 text-sm text-muted-foreground">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="mt-0">
            <EmployeeSection router={router} />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-0">
            <ProjectSection router={router} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-0">
            <TaskSection router={router} />
          </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = memo(({ title, value, subtitle, icon: Icon, trend, loading }: any) => {
  return (
    <Card className="bg-card border border-border hover:border-burgundy-500/50 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardContent className="p-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
              <Icon className="h-4 w-4 shrink-0 text-burgundy-600" />
            </div>
            <h3 className="text-2xl font-semibold tabular-nums mb-1 text-foreground">{value}</h3>
            <div className="flex items-center gap-2 min-w-0">
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
    <div className={`border border-border border-l-4 rounded-lg p-3 bg-card shadow-sm ${colorClasses[color]}`}>
      <div className="flex justify-between items-center gap-2 mb-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
        <Icon className={`h-4 w-4 flex-shrink-0 ${iconColors[color]}`} />
      </div>
      <h3 className="text-lg font-semibold tabular-nums mb-1 text-foreground truncate" title={value}>{value}</h3>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
  );
});
FinanceCard.displayName = 'FinanceCard';

const MiniStat = ({ label, icon: Icon, iconClass, children }: { label: string; icon: LucideIcon; iconClass: string; children: React.ReactNode }) => (
  <Card className="bg-card border border-border shadow-sm">
    <CardContent className="flex items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{children}</p>
      </div>
      <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
    </CardContent>
  </Card>
);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Employee Management</h2>
        <Button onClick={() => router.push("/dashboard/hr/employees")}>
          View All Employees
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <MiniStat label="Total" icon={Users} iconClass="text-burgundy-600">{employees.length}</MiniStat>
        <MiniStat label="Active" icon={Activity} iconClass="text-success">{employees.filter(e => e.status === 'active').length}</MiniStat>
        <MiniStat label="Departments" icon={Briefcase} iconClass="text-info">{new Set(employees.flatMap(e => e.departments?.length > 0 ? e.departments : e.department ? [e.department] : [])).size}</MiniStat>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Recent Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <EmployeeList employees={employees} onEdit={(id) => router.push(`/dashboard/hr/employees/${id}/edit`)} />
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Project Management</h2>
        <Button onClick={() => router.push("/dashboard/projects")}>
          View All Projects
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <MiniStat label="Total" icon={Briefcase} iconClass="text-burgundy-600">{projects.length}</MiniStat>
        <MiniStat label="Active" icon={Activity} iconClass="text-success">{projects.filter(p => p.status === 'active').length}</MiniStat>
        <MiniStat label="Avg Progress" icon={Target} iconClass="text-info">{projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0}%</MiniStat>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Task Management</h2>
        <Button onClick={() => router.push("/dashboard/tasks")}>
          View All Tasks
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <MiniStat label="Total" icon={CheckSquare} iconClass="text-burgundy-600">{tasks.length}</MiniStat>
        <MiniStat label="Completed" icon={Activity} iconClass="text-success">{tasks.filter(t => t.status === 'completed').length}</MiniStat>
        <MiniStat label="In Progress" icon={Clock} iconClass="text-warning">{tasks.filter(t => t.status === 'in-progress').length}</MiniStat>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TaskList tasks={tasks} onView={(id) => router.push(`/dashboard/tasks/${id}`)} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
