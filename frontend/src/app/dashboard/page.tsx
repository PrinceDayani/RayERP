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
  CheckSquare
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { initializeSocket, getSocket } from "@/lib/socket";
import { dashboardAPI, DashboardStats as APIDashboardStats, RecentActivity } from "@/lib/api/dashboardAPI";
import RealTimeIndicator from "@/components/Dashboard/RealTimeIndicator";

// Enhanced interfaces
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  attendanceToday?: number;
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
    attendanceToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
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
      
      // Fetch real-time dashboard data
      const [dashboardResponse, activitiesResponse] = await Promise.all([
        dashboardAPI.getDashboardStats(),
        dashboardAPI.getRecentActivities().catch(() => ({ success: false, data: [] }))
      ]);
      
      if (dashboardResponse.success) {
        const apiData = dashboardResponse.data;
        setStats({
          totalEmployees: apiData.employeeMetrics.total,
          activeEmployees: apiData.employeeMetrics.active,
          totalProjects: apiData.projectMetrics.total,
          completedProjects: apiData.projectMetrics.completed,
          totalTasks: apiData.taskMetrics.total,
          completedTasks: apiData.taskMetrics.completed,
          attendanceToday: apiData.employeeMetrics.attendanceToday,
        });
      }
      
      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.data);
      }
      
      setLastUpdated(new Date());

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
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
    
    // Set up auto-refresh when not connected via socket
    if (autoRefresh && !socketConnected) {
      pollingIntervalRef.current = setInterval(fetchDashboardData, refreshInterval);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchDashboardData]);

  // Socket management
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const socket = initializeSocket();
    socketRef.current = socket;

    const handleSocketConnect = () => {
      setSocketConnected(true);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      fetchDashboardData(); // Refresh data on connect
      toast({
        title: "Connected",
        description: "Real-time updates are now active",
        variant: "default",
      });
    };

    const handleSocketDisconnect = (reason: string) => {
      setSocketConnected(false);
      if (autoRefresh && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchDashboardData, refreshInterval);
      }
    };

    const handleSocketError = (err: Error) => {
      console.error("Socket connection error:", err.message);
      setSocketConnected(false);
      if (autoRefresh && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchDashboardData, refreshInterval);
      }
    };

    if (socket) {
      socket.on("connect", handleSocketConnect);
      socket.on("disconnect", handleSocketDisconnect);
      socket.on("connect_error", handleSocketError);
      socket.on("dashboard:refresh", fetchDashboardData);
      socket.on("employee:updated", fetchDashboardData);
      socket.on("project:updated", fetchDashboardData);
      socket.on("task:updated", fetchDashboardData);
      socket.on("attendance:updated", fetchDashboardData);

      return () => {
        socket.off("connect", handleSocketConnect);
        socket.off("disconnect", handleSocketDisconnect);
        socket.off("connect_error", handleSocketError);
        socket.off("dashboard:refresh", fetchDashboardData);
        socket.off("employee:updated", fetchDashboardData);
        socket.off("project:updated", fetchDashboardData);
        socket.off("task:updated", fetchDashboardData);
        socket.off("attendance:updated", fetchDashboardData);
        socket.disconnect();
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
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
      ${colorScheme === 'blue' ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800' : ''}
    `}>
      <CardContent className="pt-6 theme-compact-padding">
        <div className="flex items-start gap-4">
          <Icon className={`
            h-8 w-8 flex-shrink-0
            ${colorScheme === 'red' ? 'text-red-600 dark:text-red-400' : ''}
            ${colorScheme === 'purple' ? 'text-purple-600 dark:text-purple-400' : ''}
            ${colorScheme === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
          `} />
          <div>
            <h3 className={`
              font-bold text-lg theme-responsive-text theme-text
              ${colorScheme === 'red' ? 'text-red-800 dark:text-red-300' : ''}
              ${colorScheme === 'purple' ? 'text-purple-800 dark:text-purple-300' : ''}
              ${colorScheme === 'blue' ? 'text-blue-800 dark:text-blue-300' : ''}
            `}>
              {title}
            </h3>
            <p className={`
              theme-text
              ${colorScheme === 'red' ? 'text-red-700 dark:text-red-400' : ''}
              ${colorScheme === 'purple' ? 'text-purple-700 dark:text-purple-400' : ''}
              ${colorScheme === 'blue' ? 'text-blue-700 dark:text-blue-400' : ''}
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
        <div className="flex justify-between items-start mb-6">
          <DashboardHeader 
            user={user} 
            isAuthenticated={isAuthenticated}
            socketConnected={socketConnected}
          />
          {isAuthenticated && (
            <RealTimeIndicator 
              isConnected={socketConnected}
              lastUpdated={lastUpdated || undefined}
              isLoading={dataLoading}
            />
          )}
        </div>

        {/* Role-specific welcome messages */}
        {isAuthenticated && user && (
          <>
            {user.role === UserRole.ROOT && (
              <RoleWelcomeCard 
                role={UserRole.ROOT}
                icon={ShieldCheck}
                title="Root Access Granted"
                description="You have full system access with root privileges. Use with caution."
                colorScheme="red"
              />
            )}
            {user.role === UserRole.SUPER_ADMIN && (
              <RoleWelcomeCard 
                role={UserRole.SUPER_ADMIN}
                icon={ShieldCheck}
                title="Super Admin Access"
                description="Welcome to your administrative dashboard with elevated permissions."
                colorScheme="purple"
              />
            )}
            {user.role === UserRole.ADMIN && (
              <RoleWelcomeCard 
                role={UserRole.ADMIN}
                icon={UserCog}
                title="Admin Dashboard"
                description="You have administrative access to manage business operations."
                colorScheme="blue"
              />
            )}
          </>
        )}

        {/* Connection Status */}
        {isAuthenticated && <ConnectionStatus />}

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
            <StatsCards 
              stats={stats} 
              isAuthenticated={isAuthenticated} 
              loading={dataLoading} 
            />

            {/* Quick Data Overview */}
            {isAuthenticated && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      Employee Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Today:</span>
                        <span className="text-sm font-medium text-green-600">{stats.activeEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Staff:</span>
                        <span className="text-sm font-medium">{stats.totalEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Attendance:</span>
                        <span className="text-sm font-medium">{stats.attendanceToday || 0}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push("/dashboard/employees")}
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>

                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-purple-500" />
                      Project Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completed:</span>
                        <span className="text-sm font-medium text-green-600">{stats.completedProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">In Progress:</span>
                        <span className="text-sm font-medium text-orange-600">{stats.totalProjects - stats.completedProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate:</span>
                        <span className="text-sm font-medium">{stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push("/dashboard/projects")}
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                    >
                      View Projects
                    </Button>
                  </CardContent>
                </Card>

                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <CheckSquare className="h-5 w-5 mr-2 text-green-500" />
                      Task Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completed:</span>
                        <span className="text-sm font-medium text-green-600">{stats.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pending:</span>
                        <span className="text-sm font-medium text-orange-600">{stats.totalTasks - stats.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion:</span>
                        <span className="text-sm font-medium">{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push("/dashboard/tasks")}
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                    >
                      View Tasks
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <QuickActions 
              isAuthenticated={isAuthenticated} 
              router={router} 
            />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            {/* Employee Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Today</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold">{Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employee Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-lg font-semibold">All Employees</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage all employee records, personal information, and employment details.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/employees")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View Employees
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckSquare className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-lg font-semibold">Attendance</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track daily attendance, check-ins, check-outs, and generate attendance reports.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/employees/attendance")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View Attendance
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <UserCog className="h-6 w-6 text-purple-500 mr-3" />
                    <h3 className="text-lg font-semibold">Add Employee</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Register new employees and set up their profiles and access permissions.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/employees/create")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    Add New Employee
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Employee Activity */}
            {isAuthenticated && (
              <Card className="theme-card theme-shadow theme-transition">
                <CardHeader>
                  <CardTitle>Recent Employee Activity</CardTitle>
                  <CardDescription>Latest updates and changes in employee records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities
                        .filter(activity => activity.type === 'employee' || activity.type === 'attendance')
                        .slice(0, 3)
                        .map((activity) => {
                          const getActivityIcon = (type: string) => {
                            switch (type) {
                              case 'employee': return <Users className="h-4 w-4 text-blue-600" />;
                              case 'attendance': return <CheckSquare className="h-4 w-4 text-green-600" />;
                              default: return <Users className="h-4 w-4 text-gray-600" />;
                            }
                          };
                          
                          const getBgColor = (type: string) => {
                            switch (type) {
                              case 'employee': return 'bg-blue-100';
                              case 'attendance': return 'bg-green-100';
                              default: return 'bg-gray-100';
                            }
                          };
                          
                          return (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`h-8 w-8 ${getBgColor(activity.type)} rounded-full flex items-center justify-center`}>
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No recent activities</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Project Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold">{stats.totalProjects}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.totalProjects - stats.completedProjects}</p>
                    </div>
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">{stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Briefcase className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-lg font-semibold">All Projects</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View all projects, track progress, manage timelines and deliverables.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckSquare className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-lg font-semibold">My Tasks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage tasks assigned to you across all projects.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects/my-tasks")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    My Tasks
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <BarChart4 className="h-6 w-6 text-purple-500 mr-3" />
                    <h3 className="text-lg font-semibold">Reports</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate project reports, analytics, and performance metrics.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects/reports")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-orange-500 mr-3" />
                    <h3 className="text-lg font-semibold">Create Project</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new project, set up teams, and define project scope.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects/create")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    New Project
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckSquare className="h-6 w-6 text-red-500 mr-3" />
                    <h3 className="text-lg font-semibold">Task Management</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create, assign, and track tasks across all projects.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects/tasks")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    Manage Tasks
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Task Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold">{stats.totalTasks}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.totalTasks - stats.completedTasks}</p>
                    </div>
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="theme-card theme-shadow theme-transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckSquare className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-lg font-semibold">All Tasks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage all tasks across projects, track progress and deadlines.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/tasks")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View All Tasks
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-lg font-semibold">My Tasks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View tasks assigned to you, update status, and manage your workload.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/projects/my-tasks")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    My Tasks
                  </Button>
                </CardContent>
              </Card>

              <Card className="theme-card theme-shadow theme-transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <BarChart4 className="h-6 w-6 text-purple-500 mr-3" />
                    <h3 className="text-lg font-semibold">Task Analytics</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    View task performance metrics, completion rates, and productivity insights.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/reports")}
                    className="w-full"
                    disabled={!isAuthenticated}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Task Priority Overview */}
            {isAuthenticated && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader>
                    <CardTitle>Task Priority Distribution</CardTitle>
                    <CardDescription>Overview of tasks by priority level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">High Priority</span>
                        </div>
                        <Badge variant="destructive">12</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Medium Priority</span>
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-600">28</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Low Priority</span>
                        </div>
                        <Badge variant="outline" className="border-green-500 text-green-600">45</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="theme-card theme-shadow theme-transition">
                  <CardHeader>
                    <CardTitle>Recent Task Updates</CardTitle>
                    <CardDescription>Latest task activities and changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckSquare className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Task completed</p>
                          <p className="text-xs text-muted-foreground">"Update user interface" marked as done</p>
                        </div>
                        <span className="text-xs text-muted-foreground">1h ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Task assigned</p>
                          <p className="text-xs text-muted-foreground">"Database optimization" assigned to John</p>
                        </div>
                        <span className="text-xs text-muted-foreground">3h ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Priority updated</p>
                          <p className="text-xs text-muted-foreground">"Bug fix" priority changed to high</p>
                        </div>
                        <span className="text-xs text-muted-foreground">5h ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                            className="text-blue-700 border-blue-700 dark:text-blue-400 dark:border-blue-400 theme-rounded theme-text"
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

export default Dashboard;