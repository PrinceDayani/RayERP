//path: frontend\src\app\dashboard\page.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";

import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCards from "@/components/Dashboard/StatsCards";
import QuickActions from "@/components/Dashboard/QuickActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { initializeSocket, getSocket } from "@/lib/socket";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { EmployeeList } from "@/components/employee";
import { employeesAPI } from "@/lib/api/employeesAPI";
import { ProjectList } from "@/components/projects";
import { projectsAPI } from "@/lib/api/projectsAPI";
import { TaskList } from "@/components/tasks";
import { tasksAPI } from "@/lib/api/tasksAPI";

// Enhanced interfaces
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  revenue?: number;
  expenses?: number;
  profit?: number;
}

interface AnalyticsData {
  projectProgress: Array<{ name: string; progress: number; status: string }>;
  taskDistribution: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; time: string }>;
}

const Dashboard = () => {
  const { user, loading, isAuthenticated, hasMinimumRole } = useAuth();
  const router = useRouter();
  
  // State management with proper typing
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    projectProgress: [],
    taskDistribution: [],
    monthlyRevenue: [],
    teamProductivity: [],
    recentActivity: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Refs
  const socketRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setDataLoading(true);
      setDataError(null);
      
      // Mock data for now - replace with actual API calls
      setStats({
        totalEmployees: 25,
        activeEmployees: 23,
        totalProjects: 12,
        completedProjects: 8,
        totalTasks: 156,
        completedTasks: 98,
        revenue: 485000,
        expenses: 325000,
        profit: 160000,
      });

      // Add random variation for demo real-time effect
      const randomVariation = () => Math.floor(Math.random() * 5) + 1;
      
      setAnalytics({
        projectProgress: [
          { name: "Website Redesign", progress: Math.min(85 + randomVariation(), 100), status: "active" },
          { name: "Mobile App", progress: Math.min(60 + randomVariation(), 100), status: "active" },
          { name: "API Integration", progress: Math.min(40 + randomVariation(), 100), status: "planning" },
          { name: "Database Migration", progress: 100, status: "completed" },
        ],
        taskDistribution: [
          { name: "Completed", value: 98 + randomVariation() },
          { name: "In Progress", value: 42 },
          { name: "Pending", value: Math.max(16 - randomVariation(), 0) },
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 65000, expenses: 45000 },
          { month: "Feb", revenue: 72000, expenses: 48000 },
          { month: "Mar", revenue: 68000, expenses: 46000 },
          { month: "Apr", revenue: 85000, expenses: 52000 },
          { month: "May", revenue: 92000, expenses: 58000 },
          { month: "Jun", revenue: 103000 + (randomVariation() * 1000), expenses: 76000 },
        ],
        teamProductivity: [
          { name: "Development", completed: 45 + randomVariation(), pending: Math.max(12 - randomVariation(), 0) },
          { name: "Design", completed: 28 + randomVariation(), pending: Math.max(8 - randomVariation(), 0) },
          { name: "Marketing", completed: 15 + randomVariation(), pending: 5 },
          { name: "Sales", completed: 10 + randomVariation(), pending: 3 },
        ],
        recentActivity: [
          { id: "1", type: "project", description: "New project 'Website Redesign' created", time: "2 hours ago" },
          { id: "2", type: "task", description: "Task 'API Documentation' completed", time: "4 hours ago" },
          { id: "3", type: "employee", description: "New employee 'John Doe' added", time: "5 hours ago" },
          { id: "4", type: "project", description: "Project 'Mobile App' milestone reached", time: "1 day ago" },
        ],
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Error fetching dashboard data:", {
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      setDataError("Failed to load dashboard data. Please try refreshing the page.");
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (!isAuthenticated) {
      setDataLoading(false);
      return;
    }
    
    fetchDashboardData();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchDashboardData]);

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !socketConnected) return;
    
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, socketConnected, fetchDashboardData]);

  // Socket management with real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mounted = true;
    
    const initSocket = async () => {
      try {
        const socket = await initializeSocket();
        if (!mounted || !socket) return;
        
        socketRef.current = socket;

        const handleSocketConnect = () => {
          if (!mounted) return;
          setSocketConnected(true);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        };

        const handleSocketDisconnect = (reason: string) => {
          if (!mounted) return;
          setSocketConnected(false);
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
          }
        };

        const handleSocketError = (err: Error) => {
          if (!mounted) return;
          console.warn("Socket connection error:", {
            message: err.message || 'Unknown socket error',
            type: err.name || 'Error',
            timestamp: new Date().toISOString()
          });
          setSocketConnected(false);
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
          }
        };

        // Real-time event handlers
        const handleStatsUpdate = (newStats: DashboardStats) => {
          if (mounted) setStats(newStats);
        };

        const handleEmployeeUpdate = () => {
          if (mounted) fetchDashboardData();
        };

        const handleProjectUpdate = () => {
          if (mounted) fetchDashboardData();
        };

        const handleTaskUpdate = () => {
          if (mounted) fetchDashboardData();
        };

        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleSocketDisconnect);
        socket.on("connect_error", handleSocketError);
        socket.on("dashboard:refresh", fetchDashboardData);
        socket.on("dashboard:stats", handleStatsUpdate);
        socket.on("employee:created", handleEmployeeUpdate);
        socket.on("employee:updated", handleEmployeeUpdate);
        socket.on("employee:deleted", handleEmployeeUpdate);
        socket.on("project:created", handleProjectUpdate);
        socket.on("project:updated", handleProjectUpdate);
        socket.on("project:deleted", handleProjectUpdate);
        socket.on("task:created", handleTaskUpdate);
        socket.on("task:updated", handleTaskUpdate);
        socket.on("task:deleted", handleTaskUpdate);
      } catch (error) {
        console.warn('Socket initialization failed:', error);
        if (mounted && !pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
        }
      }
    };
    
    initSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchDashboardData]);

  // Demo data for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  // Role-specific welcome components
  const RoleWelcomeCard = ({ role, icon: Icon, title, description, colorScheme }: {
    role: UserRole;
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
  );

  // Connection status component
  const ConnectionStatus = () => (
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
  );

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
        />

        {/* Role-specific welcome messages with live status */}
        {isAuthenticated && user && (
          <>
            {user.role === UserRole.ROOT && (
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
            {user.role === UserRole.SUPER_ADMIN && (
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
            {user.role === UserRole.ADMIN && (
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
                onClick={() => {
                  setDataError(null);
                  fetchDashboardData();
                }}
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
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 w-full theme-card theme-shadow gap-1">
            <TabsTrigger 
              value="overview" 
              className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="employees"
              className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Employees
            </TabsTrigger>
            <TabsTrigger 
              value="projects"
              className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Tasks
            </TabsTrigger>
            {hasMinimumRole(UserRole.ADMIN) && (
              <TabsTrigger 
                value="analytics"
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Analytics
              </TabsTrigger>
            )}
            {hasMinimumRole(UserRole.SUPER_ADMIN) && (
              <TabsTrigger 
                value="admin"
                className="theme-text theme-touch-target theme-focusable theme-transition theme-rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Analytics Section - Moved to Top */}
            {isAuthenticated && (
              <>
                {/* Financial Overview - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <h3 className="text-xl font-bold">₹{(stats.revenue || 0).toLocaleString()}</h3>
                          <span className="text-xs text-green-600 flex items-center"><ArrowUpRight className="h-3 w-3" />12.5%</span>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Expenses</p>
                          <h3 className="text-xl font-bold">₹{(stats.expenses || 0).toLocaleString()}</h3>
                          <span className="text-xs text-orange-600 flex items-center"><ArrowUpRight className="h-3 w-3" />8.2%</span>
                        </div>
                        <TrendingDown className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Profit</p>
                          <h3 className="text-xl font-bold">₹{(stats.profit || 0).toLocaleString()}</h3>
                          <span className="text-xs text-red-600 flex items-center"><ArrowUpRight className="h-3 w-3" />18.3%</span>
                        </div>
                        <Target className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center"><BarChart4 className="h-4 w-4 mr-2" />Revenue vs Expenses</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={analytics.monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                          <YAxis style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center"><Activity className="h-4 w-4 mr-2" />Task Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={analytics.taskDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {analytics.taskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b'][index % 3]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Progress & Team Productivity - Compact */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center"><Briefcase className="h-4 w-4 mr-2" />Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {analytics.projectProgress.map((project, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{project.name}</span>
                            <Badge variant="secondary" className="text-xs">{project.progress}%</Badge>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center"><Users className="h-4 w-4 mr-2" />Team Productivity</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={analytics.teamProductivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" style={{ fontSize: '11px' }} />
                          <YAxis style={{ fontSize: '11px' }} />
                          <Tooltip />
                          <Bar dataKey="completed" fill="#10b981" />
                          <Bar dataKey="pending" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity - Compact */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center"><Clock className="h-4 w-4 mr-2" />Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
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
                  </CardContent>
                </Card>
              </>
            )}

            <StatsCards 
              stats={stats} 
              isAuthenticated={isAuthenticated} 
              loading={dataLoading} 
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

          {/* Analytics Tab */}
          {hasMinimumRole(UserRole.ADMIN) && (
            <TabsContent value="analytics" className="space-y-6">
              {isAuthenticated ? (
                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="theme-compact-padding">
                    <CardTitle className="theme-text theme-responsive-text">Analytics Dashboard</CardTitle>
                    <CardDescription className="theme-text">Business intelligence and reporting</CardDescription>
                  </CardHeader>
                  <CardContent className="theme-compact-padding">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-primary/10 p-4 theme-rounded-lg border border-primary/20 theme-transition">
                        <p className="text-sm text-muted-foreground theme-text">Employee Productivity</p>
                        <p className="text-2xl font-bold text-foreground theme-responsive-text theme-text">
                          {stats.activeEmployees > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                        </p>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600 dark:text-green-400 theme-text">
                            +8.2% vs last month
                          </span>
                        </div>
                      </div>
                      <div className="bg-muted p-4 theme-rounded-lg theme-transition">
                        <p className="text-sm text-muted-foreground theme-text">Project Completion Rate</p>
                        <p className="text-2xl font-bold text-foreground theme-responsive-text theme-text">
                          {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="theme-card theme-shadow theme-transition">
                  <CardContent className="p-8 text-center theme-compact-padding">
                    <BarChart4 className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                      Analytics Dashboard
                    </h3>
                    <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                      Access detailed analytics and business intelligence reports.
                    </p>
                    <Button 
                      onClick={() => router.push("/login")}
                      size="lg"
                      className="theme-button theme-touch-target theme-focusable theme-transition"
                    >
                      Login to View Analytics
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
          
          {/* Administration Tab */}
          {hasMinimumRole(UserRole.SUPER_ADMIN) && (
            <TabsContent value="admin" className="space-y-6">
              {/* Admin Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="theme-compact-padding">
                    <CardTitle className="flex items-center theme-text theme-responsive-text">
                      <UserCog className="h-5 w-5 mr-2 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription className="theme-text">
                      Manage system users and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="theme-compact-padding">
                    <p className="text-sm text-muted-foreground mb-4 theme-text">
                      Create, update, and manage user accounts and their access levels.
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/users")}
                      className="w-full theme-button theme-touch-target theme-focusable theme-transition"
                    >
                      Manage Users
                    </Button>
                  </CardContent>
                </Card>

                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="theme-compact-padding">
                    <CardTitle className="flex items-center theme-text theme-responsive-text">
                      <Settings className="h-5 w-5 mr-2 text-primary" />
                      System Settings
                    </CardTitle>
                    <CardDescription className="theme-text">
                      Configure global system preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="theme-compact-padding">
                    <p className="text-sm text-muted-foreground mb-4 theme-text">
                      Adjust system-wide settings, notifications, and default behaviors.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/settings")}
                      className="w-full theme-button theme-touch-target theme-focusable theme-transition"
                    >
                      System Settings
                    </Button>
                  </CardContent>
                </Card>

                {hasMinimumRole(UserRole.ROOT) && (
                  <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 theme-card theme-shadow theme-transition">
                    <CardHeader className="theme-compact-padding">
                      <CardTitle className="flex items-center theme-text theme-responsive-text">
                        <ShieldCheck className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                        System Administration
                      </CardTitle>
                      <CardDescription className="theme-text">
                        Advanced system operations and maintenance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="theme-compact-padding">
                      <p className="text-sm text-muted-foreground mb-4 theme-text">
                        Access advanced system controls, logs, and maintenance tools.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => router.push("/dashboard/admin")}
                        className="w-full theme-button theme-touch-target theme-focusable theme-transition"
                      >
                        System Admin Panel
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Role Information Card */}
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 theme-card theme-shadow theme-transition">
                <CardHeader className="theme-compact-padding">
                  <CardTitle className="theme-text theme-responsive-text">Administrative Information</CardTitle>
                  <CardDescription className="theme-text">
                    Current role and system access levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="theme-compact-padding">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground theme-text">Your current role:</span>
                      <Badge 
                        variant="outline" 
                        className="font-semibold theme-rounded theme-text"
                      >
                        {user?.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground theme-text">Role Hierarchy:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-red-700 border-red-700 dark:text-red-400 dark:border-red-400 theme-rounded theme-text"
                          >
                            Root
                          </Badge>
                          <span className="text-sm text-muted-foreground theme-text">Complete system access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-purple-700 border-purple-700 dark:text-purple-400 dark:border-purple-400 theme-rounded theme-text"
                          >
                            Super Admin
                          </Badge>
                          <span className="text-sm text-muted-foreground theme-text">Administrative access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-red-700 border-red-700 dark:text-red-400 dark:border-red-400 theme-rounded theme-text"
                          >
                            Admin
                          </Badge>
                          <span className="text-sm text-muted-foreground theme-text">Management access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-green-700 border-green-700 dark:text-green-400 dark:border-green-400 theme-rounded theme-text"
                          >
                            Normal
                          </Badge>
                          <span className="text-sm text-muted-foreground theme-text">Standard access</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
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
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
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
          <TaskList 
            tasks={tasks}
            onView={(id) => router.push(`/dashboard/tasks/${id}`)}
          />
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
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading projects...</p>
        </CardContent>
      </Card>
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
          <ProjectList 
            projects={projects}
            onView={(id) => router.push(`/dashboard/projects/${id}`)}
            onEdit={(id) => router.push(`/dashboard/projects/${id}/edit`)}
          />
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
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading employees...</p>
        </CardContent>
      </Card>
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
                <h3 className="text-2xl font-bold">{new Set(employees.map(e => e.department)).size}</h3>
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
          <EmployeeList 
            employees={employees}
            onEdit={(id) => router.push(`/dashboard/employees/${id}/edit`)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
