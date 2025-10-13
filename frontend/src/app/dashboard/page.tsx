//path: frontend\src\app\dashboard\page.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
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

// Enhanced interfaces
interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
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
      });

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
      toast({
        title: "Connected",
        description: "Real-time updates are now active",
        variant: "default",
      });
    };

    const handleSocketDisconnect = (reason: string) => {
      setSocketConnected(false);
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
      }
    };

    const handleSocketError = (err: Error) => {
      console.error("Socket connection error:", err.message);
      setSocketConnected(false);
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
      }
    };

    if (socket) {
      socket.on("connect", handleSocketConnect);
      socket.on("disconnect", handleSocketDisconnect);
      socket.on("connect_error", handleSocketError);
      socket.on("dashboard:refresh", fetchDashboardData);

      return () => {
        socket.off("connect", handleSocketConnect);
        socket.off("disconnect", handleSocketDisconnect);
        socket.off("connect_error", handleSocketError);
        socket.off("dashboard:refresh", fetchDashboardData);
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
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground theme-text">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6 theme-text theme-content mx-auto">
        {/* Header */}
        <DashboardHeader 
          user={user} 
          isAuthenticated={isAuthenticated}
          socketConnected={socketConnected}
        />

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

            <QuickActions 
              isAuthenticated={isAuthenticated} 
              router={router} 
            />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card className="theme-card theme-shadow theme-transition">
              <CardContent className="p-8 text-center theme-compact-padding">
                <Users className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                  Employee Management
                </h3>
                <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                  {isAuthenticated 
                    ? "Manage employee records, attendance, and performance tracking."
                    : "Please log in to access employee management features."
                  }
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => router.push("/dashboard/employees")}
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Go to Employees
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card className="theme-card theme-shadow theme-transition">
              <CardContent className="p-8 text-center theme-compact-padding">
                <Briefcase className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                  Project Management
                </h3>
                <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                  {isAuthenticated 
                    ? "Create, manage, and track project progress and deliverables."
                    : "Please log in to access project management features."
                  }
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => router.push("/dashboard/projects")}
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Go to Projects
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="theme-card theme-shadow theme-transition">
              <CardContent className="p-8 text-center theme-compact-padding">
                <CheckSquare className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2 text-foreground theme-responsive-text theme-text">
                  Task Management
                </h3>
                <p className="text-muted-foreground mb-6 theme-text max-w-md mx-auto">
                  {isAuthenticated 
                    ? "Assign, track, and manage tasks across all projects."
                    : "Please log in to access task management features."
                  }
                </p>
                {isAuthenticated ? (
                  <Button 
                    onClick={() => router.push("/dashboard/tasks")}
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Go to Tasks
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push("/login")}
                    variant="outline"
                    size="lg"
                    className="theme-button theme-touch-target theme-focusable theme-transition"
                  >
                    Login Required
                  </Button>
                )}
              </CardContent>
            </Card>
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
    </Layout>
  );
};

export default Dashboard;