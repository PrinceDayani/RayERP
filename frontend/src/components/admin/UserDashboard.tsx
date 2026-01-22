//path: frontend\src\app\dashboard\page.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCards from "@/components/Dashboard/StatsCards";
import QuickActions from "@/components/Dashboard/QuickActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  BarChart4, 
  TrendingUp, 
  ShieldCheck, 
  UserCog,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Briefcase,
  CheckSquare,
  Activity,
  Clock,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Shield
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { initializeSocket, getSocket } from "@/lib/socket";
import { hasPermission, hasMinimumLevel, PERMISSIONS, ROLE_LEVELS } from "@/lib/permissions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSalesData } from "@/hooks/useSalesData";
import { formatINR } from "@/lib/currency";
const AnalyticsCharts = lazy(() => import('@/components/Dashboard/AnalyticsCharts'));
const EmployeeList = lazy(() => import('@/components/employee').then(m => ({ default: m.EmployeeList })));
const ProjectList = lazy(() => import('@/components/projects').then(m => ({ default: m.ProjectList })));
const TaskList = lazy(() => import('@/components/tasks').then(m => ({ default: m.TaskList })));
const FinanceAnalyticsDashboard = lazy(() => import('@/components/finance/FinanceAnalyticsDashboard'));
import { UserManagement } from '@/components/admin/UserManagement';
import { employeesAPI } from "@/lib/api/employeesAPI";
import { projectsAPI } from "@/lib/api/projectsAPI";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { trendsAPI, TrendsResponse } from "@/lib/api/trendsAPI";
import { analyticsAPI, AnalyticsResponse } from "@/lib/api/analyticsAPI";

// Enhanced interfaces
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  revenue?: number;
  expenses?: number;
  profit?: number;
  // Sales data
  salesRevenue?: number;
  salesPaid?: number;
  salesPending?: number;
  salesCount?: number;
  // Project data
  projectRevenue?: number;
  projectExpenses?: number;
  projectProfit?: number;
}

interface AnalyticsData {
  projectProgress: Array<{ name: string; progress: number; status: string }>;
  taskDistribution: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; time: string }>;
}

const Dashboard = () => {
  const { currency, formatAmount } = useCurrency();
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  // const { salesData, loading: salesLoading } = useSalesData();
  
  // State management with proper typing
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueView, setRevenueView] = useState<'sales' | 'projects'>('sales');
  const { stats, loading: dataLoading, error: dataError, socketConnected, refresh } = useDashboardData(isAuthenticated);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    projectProgress: [],
    taskDistribution: [],
    monthlyRevenue: [],
    teamProductivity: [],
    recentActivity: [],
  });
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  
  // Refs
  const socketRef = useRef<any>(null);

  // Fetch analytics and trends with real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const [analyticsData, trendsData] = await Promise.allSettled([
          analyticsAPI.getAnalytics().catch(err => {
            console.warn('Analytics API failed:', err.message);
            return null;
          }),
          trendsAPI.getTrends().catch(err => {
            console.warn('Trends API failed:', err.message);
            return null;
          })
        ]);
        
        if (mounted) {
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
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    // Refetch on tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        analyticsAPI.clearCache();
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => { 
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Real-time activity feed listener
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const socket = getSocket();
    if (!socket) return;

    const handleActivityLog = (activity: any) => {
      setAnalytics(prev => ({
        ...prev,
        recentActivity: [
          {
            id: activity.id || Date.now().toString(),
            type: activity.type || 'system',
            description: activity.message || activity.description,
            time: new Date(activity.timestamp).toLocaleString(),
            priority: activity.priority || 'normal',
            user: activity.user,
            metadata: activity.metadata
          },
          ...prev.recentActivity.slice(0, 19)
        ]
      }));
    };

    const handleRootActivity = (activity: any) => {
      // Root users get high-priority activities
      setAnalytics(prev => ({
        ...prev,
        recentActivity: [
          {
            id: activity.id || Date.now().toString(),
            type: activity.type || 'system',
            description: `🔴 ${activity.message || activity.description}`,
            time: new Date(activity.timestamp).toLocaleString(),
            priority: 'high',
            user: activity.user,
            metadata: activity.metadata
          },
          ...prev.recentActivity.slice(0, 19)
        ]
      }));
      
      // Show toast notification for Root users
      toast({
        title: "System Activity",
        description: activity.message,
        variant: "default"
      });
    };

    socket.on('activity_log', handleActivityLog);
    socket.on('root:activity', handleRootActivity);

    return () => {
      socket.off('activity_log', handleActivityLog);
      socket.off('root:activity', handleRootActivity);
    };
  }, [isAuthenticated]);







  // Role-specific welcome components
  const RoleWelcomeCard = memo(({ role, icon: Icon, title, description, colorScheme }: {
    role: string;
    icon: any;
    title: string;
    description: string;
    colorScheme: 'red' | 'purple' | 'blue';
  }) => (
    <Card className={`
      mb-6 theme-card theme-shadow theme-transition
      ${colorScheme === 'red' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800' : ''}
      ${colorScheme === 'purple' ? 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800' : ''}
      ${colorScheme === 'blue' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800' : ''}
    `}>
      <CardContent className="pt-6 theme-compact-padding">
        <div className="flex items-start gap-4">
          <Icon className={`
            h-8 w-8 flex-shrink-0
            ${colorScheme === 'red' ? 'text-red-600 dark:text-red-400' : ''}
            ${colorScheme === 'purple' ? 'text-purple-600 dark:text-purple-400' : ''}
            ${colorScheme === 'blue' ? 'text-red-600 dark:text-red-400' : ''}
          `} />
          <div>
            <h3 className={`
              font-bold text-lg theme-responsive-text theme-text
              ${colorScheme === 'red' ? 'text-red-800 dark:text-red-300' : ''}
              ${colorScheme === 'purple' ? 'text-purple-800 dark:text-purple-300' : ''}
              ${colorScheme === 'blue' ? 'text-red-800 dark:text-red-300' : ''}
            `}>
              {title}
            </h3>
            <p className={`
              theme-text
              ${colorScheme === 'red' ? 'text-red-700 dark:text-red-400' : ''}
              ${colorScheme === 'purple' ? 'text-purple-700 dark:text-purple-400' : ''}
              ${colorScheme === 'blue' ? 'text-red-700 dark:text-red-400' : ''}
            `}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ));

  // Connection status component
  const ConnectionStatus = memo(() => (
    <Card className={`
      theme-card theme-shadow theme-transition mb-4
      ${socketConnected 
        ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800' 
        : 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800'
      }
    `}>
      <CardContent className="py-4 theme-compact-padding">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {socketConnected ? (
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className={`
              text-sm font-medium theme-text
              ${socketConnected 
                ? 'text-green-700 dark:text-green-400' 
                : 'text-amber-700 dark:text-amber-400'
              }
            `}>
              {socketConnected ? 'Real-time updates active' : 'Using periodic updates'}
            </span>
          </div>
          {!socketConnected && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const socket = getSocket();
                if (socket) {
                  socket.connect();
                } else {
                  const newSocket = initializeSocket();
                  socketRef.current = newSocket;
                }
              }}
              className="text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 theme-button theme-touch-target theme-focusable theme-transition"
            >
              Reconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  ));

  // Helper function to check minimum level
  const checkMinimumLevel = (minLevel: number): boolean => {
    return hasMinimumLevel(user, minLevel);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground theme-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 theme-text theme-content mx-auto">
        {/* Header */}
        <DashboardHeader 
          user={user} 
          isAuthenticated={isAuthenticated}
          socketConnected={socketConnected}
          refreshData={refresh}
        />

        {/* Role-specific welcome messages with live status */}
        {isAuthenticated && user && (
          <>
            {(typeof user.role === 'string' ? user.role : user.role.name) === UserRole.ROOT && (
              <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 dark:border-red-800 theme-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-red-600 dark:bg-red-500 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-red-800 dark:text-red-300">
                          Root Access Granted
                        </h3>
                        <p className="text-red-700 dark:text-red-400 mt-1">
                          You have full system access with root privileges. Use with caution.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {socketConnected ? (
                        <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white flex items-center gap-1">
                          <WifiOff className="h-3 w-3" />
                          Polling
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {(typeof user.role === 'string' ? user.role : user.role.name) === UserRole.SUPER_ADMIN && (
              <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 dark:border-purple-800 theme-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-purple-800 dark:text-purple-300">
                          Super Admin Access
                        </h3>
                        <p className="text-purple-700 dark:text-purple-400 mt-1">
                          Welcome to your administrative dashboard with elevated permissions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {socketConnected ? (
                        <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white flex items-center gap-1">
                          <WifiOff className="h-3 w-3" />
                          Polling
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {(typeof user.role === 'string' ? user.role : user.role.name) === UserRole.ADMIN && (
              <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 dark:border-red-800 theme-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-red-600 dark:bg-red-500 flex items-center justify-center">
                        <UserCog className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-red-800 dark:text-red-300">
                          Admin Dashboard
                        </h3>
                        <p className="text-red-700 dark:text-red-400 mt-1">
                          You have administrative access to manage business operations.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {socketConnected ? (
                        <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white flex items-center gap-1">
                          <WifiOff className="h-3 w-3" />
                          Polling
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Data Error Alert */}
        {dataError && (
          <Alert variant="destructive" className="theme-card theme-border theme-transition">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center theme-text">
              <span>{dataError}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refresh}
                className="theme-button theme-focusable theme-transition"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Prompt for unauthenticated users */}
        {!isAuthenticated && (
          <Card className="theme-card theme-shadow theme-transition">
            <CardContent className="pt-6 text-center theme-compact-padding">
              <h2 className="text-xl font-semibold mb-2 text-foreground theme-responsive-text theme-text">
                Welcome to RayERP
              </h2>
              <p className="text-muted-foreground mb-4 theme-text">
                Please log in to access your dashboard and view real-time data.
              </p>
              <Button 
                onClick={() => router.push("/login")}
                size="lg"
                className="theme-button theme-touch-target theme-focusable theme-transition"
              >
                Login to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6 theme-transition" onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 theme-card theme-shadow gap-1">
              <TabsTrigger 
                value="overview" 
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="employees"
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none"
              >
                Employees
              </TabsTrigger>
              <TabsTrigger 
                value="projects"
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 sm:flex-none"
              >
                Tasks
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Analytics Section - Moved to Top */}
            {isAuthenticated && (
              <>
                {/* Revenue View Toggle */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Financial Overview</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={revenueView === 'sales' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRevenueView('sales')}
                    >
                      Sales Revenue
                    </Button>
                    <Button
                      variant={revenueView === 'projects' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRevenueView('projects')}
                    >
                      Project Budgets
                    </Button>
                  </div>
                </div>

                {/* Financial Overview - Executive Separated View */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {revenueView === 'sales' ? (
                    <>
                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Sales Revenue</p>
                              <h3 className="text-xl font-bold">{formatINR(stats.salesRevenue || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                {stats.salesCount || 0} invoices
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount Received</p>
                              <h3 className="text-xl font-bold text-green-600">{formatINR(stats.salesPaid || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                {stats.salesRevenue > 0 ? ((stats.salesPaid/stats.salesRevenue)*100).toFixed(1) : '0'}% collected
                              </p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Pending Amount</p>
                              <h3 className="text-xl font-bold text-orange-600">{formatINR(stats.salesPending || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                {stats.salesRevenue > 0 ? ((stats.salesPending/stats.salesRevenue)*100).toFixed(1) : '0'}% pending
                              </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <>
                      <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Project Revenue</p>
                              <h3 className="text-xl font-bold">{formatINR(stats.projectRevenue || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                {stats.totalProjects || 0} projects
                              </p>
                            </div>
                            <Briefcase className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Project Expenses</p>
                              <h3 className="text-xl font-bold text-red-600">{formatINR(stats.projectExpenses || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                Spent budget
                              </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">Project Profit</p>
                              <h3 className="text-xl font-bold text-green-600">{formatINR(stats.projectProfit || 0)}</h3>
                              <p className="text-xs text-muted-foreground">
                                Budget - Spent
                              </p>
                            </div>
                            <Target className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Charts Section - Compact */}
                <Suspense fallback={<div className="h-[200px] flex items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin" /></div>}>
                  <AnalyticsCharts 
                    monthlyRevenue={analytics.monthlyRevenue || []}
                    taskDistribution={analytics.taskDistribution || []}
                    teamProductivity={analytics.teamProductivity || []}
                  />
                </Suspense>

                {/* Project Progress & Team Productivity - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center"><Briefcase className="h-4 w-4 mr-2" />Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {analytics.projectProgress?.length > 0 ? analytics.projectProgress.map((project, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{project.name}</span>
                            <Badge variant="secondary" className="text-xs">{project.progress}%</Badge>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-sm font-medium text-muted-foreground mb-1">No Active Projects</p>
                          <p className="text-xs text-muted-foreground mb-4">Create your first project to get started</p>
                          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects/create')}>
                            Create Project
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* Recent Activity - Compact */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center"><Clock className="h-4 w-4 mr-2" />Recent Activity</CardTitle>
                      <span className="text-xs text-muted-foreground">Live updates</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {analytics.recentActivity?.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-3 py-2 border-b last:border-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {activity.type === 'project' && <Briefcase className="h-4 w-4 text-primary" />}
                              {activity.type === 'task' && <CheckSquare className="h-4 w-4 text-primary" />}
                              {activity.type === 'employee' && <Users className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">No Recent Activity</p>
                        <p className="text-xs text-muted-foreground mb-4">Activity will appear here as it happens</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <StatsCards 
              stats={stats}
              trends={trends ? { employees: trends.employees, projects: trends.projects } : undefined}
              isAuthenticated={isAuthenticated} 
              loading={dataLoading}
              router={router}
            />

            {isAuthenticated && (
              <>
              </>
            )}

            <QuickActions 
              isAuthenticated={isAuthenticated} 
              router={router} 
            />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            {isAuthenticated ? (
              <EmployeeSection router={router} />
            ) : (
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-8 text-center theme-compact-padding">
                  <Users className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                    Employee Management
                  </h3>
                  <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                    Please log in to access employee management features.
                  </p>
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {isAuthenticated ? (
              <ProjectSection router={router} />
            ) : (
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-8 text-center theme-compact-padding">
                  <Briefcase className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                    Project Management
                  </h3>
                  <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                    Please log in to access project management features.
                  </p>
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {isAuthenticated ? (
              <TaskSection router={router} />
            ) : (
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-8 text-center theme-compact-padding">
                  <CheckSquare className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                    Task Management
                  </h3>
                  <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                    Please log in to access task management features.
                  </p>
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>
    </div>
  );
};

// Task Section Component
const TaskSection = ({ router }: { router: any }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksAPI.getAll();
        setTasks((data.data || data).slice(0, 6));
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Overview</h2>
        <Button onClick={() => router.push("/dashboard/tasks")}>
          View All Tasks
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <h3 className="text-2xl font-bold">{tasks.length}</h3>
              </div>
              <CheckSquare className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3 className="text-2xl font-bold">{completedTasks}</h3>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <h3 className="text-2xl font-bold">{inProgressTasks}</h3>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RefreshCw className="h-6 w-6 animate-spin mx-auto" />}>
            <TaskList 
              tasks={tasks}
              onView={(id) => router.push(`/dashboard/tasks/${id}`)}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

// Project Section Component
const ProjectSection = ({ router }: { router: any }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getAll();
        setProjects((data.data || data).slice(0, 6));
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Overview</h2>
        <Button onClick={() => router.push("/dashboard/projects")}>
          View All Projects
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <h3 className="text-2xl font-bold">{projects.length}</h3>
              </div>
              <Briefcase className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold">{activeProjects}</h3>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <h3 className="text-2xl font-bold">{avgProgress}%</h3>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RefreshCw className="h-6 w-6 animate-spin mx-auto" />}>
            <ProjectList 
              projects={projects}
              onView={(id) => router.push(`/dashboard/projects/${id}`)}
              onEdit={(id) => router.push(`/dashboard/projects/${id}/edit`)}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

// Employee Section Component
const EmployeeSection = ({ router }: { router: any }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeesAPI.getAll();
        setEmployees((data.data || data).slice(0, 6));
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Overview</h2>
        <Button onClick={() => router.push("/dashboard/employees")}>
          View All Employees
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <h3 className="text-2xl font-bold">{employees.length}</h3>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</h3>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <h3 className="text-2xl font-bold">
                  {new Set(
                    employees.flatMap(e => 
                      e.departments && e.departments.length > 0 
                        ? e.departments 
                        : e.department ? [e.department] : []
                    )
                  ).size}
                </h3>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RefreshCw className="h-6 w-6 animate-spin mx-auto" />}>
            <EmployeeList 
              employees={employees}
              onEdit={(id) => router.push(`/dashboard/employees/${id}/edit`)}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
