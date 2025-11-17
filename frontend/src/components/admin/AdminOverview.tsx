"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UsersIcon, 
  ShieldIcon, 
  ServerIcon, 
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  ChevronDownIcon
} from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { backupAPI } from "@/lib/api/backupAPI";


interface AdminOverviewProps {
  isLoading: boolean;
}

interface SystemHealth {
  database: "healthy" | "warning" | "error";
  server: "healthy" | "warning" | "error";
  storage: "healthy" | "warning" | "error";
  memory: number;
  cpu: number;
  uptime: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  variant: "default" | "outline" | "secondary";
  isDropdown?: boolean;
}

export function AdminOverview({ isLoading }: AdminOverviewProps) {
  const router = useRouter();
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "healthy",
    server: "healthy", 
    storage: "healthy",
    memory: 65,
    cpu: 42,
    uptime: "7 days, 14 hours"
  });

  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState([
    { action: "User login", user: "john@example.com", time: "2 minutes ago", status: "success" },
    { action: "Role updated", user: "admin@example.com", time: "15 minutes ago", status: "success" },
    { action: "Failed login attempt", user: "unknown@example.com", time: "1 hour ago", status: "warning" },
    { action: "System backup", user: "system", time: "2 hours ago", status: "success" },
    { action: "Settings updated", user: "admin@example.com", time: "3 hours ago", status: "success" }
  ]);

  const handleExportLogs = async (format: 'text' | 'pdf' | 'excel' | 'csv') => {
    try {
      // Check if user is authenticated first
      const token = localStorage.getItem('auth-token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      console.log('Attempting to export logs as:', format);
      
      try {
        // Try the blob method first
        const blob = await adminAPI.exportLogs(format);
        
        if (!blob || blob.size === 0) {
          throw new Error('Empty response received');
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs.${format === 'excel' || format === 'csv' ? 'csv' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert(`Logs exported successfully as ${format.toUpperCase()}`);
      } catch (blobError) {
        console.warn('Blob export failed, trying text method:', blobError);
        
        // Fallback to text method
        const textContent = await adminAPI.exportLogsAsText(format);
        
        const blob = new Blob([textContent], { 
          type: format === 'excel' || format === 'csv' ? 'text/csv' : 'text/plain' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs.${format === 'excel' || format === 'csv' ? 'csv' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert(`Logs exported successfully as ${format.toUpperCase()} (fallback method)`);
      }
    } catch (error: any) {
      console.error('Export logs error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. You do not have permission to export logs.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message || 'Unknown error';
      }
      
      alert(`Failed to export logs: ${errorMessage}`);
    }
  };

  const handleSystemBackup = async () => {
    try {
      setIsBackupLoading(true);
      console.log('Starting system backup...');
      
      const blob = await backupAPI.downloadSystemBackup();
      console.log('Backup blob received:', blob.size, 'bytes');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `erp-system-backup-${timestamp}.zip`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`System backup downloaded successfully as ${filename}`);
      
    } catch (error: any) {
      console.error('System backup error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create system backup';
      alert(`System backup failed: ${errorMessage}`);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      console.log('Testing API connection...');
      console.log('API URL:', API_URL);
      console.log('Token present:', !!token);
      
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('API test successful:', data);
        alert('API connection test successful!');
      } else {
        const errorText = await response.text();
        console.error('API test failed:', response.status, errorText);
        alert(`API test failed: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error('API test error:', error);
      alert(`API test error: ${error.message}`);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: "Add New User",
      description: "Create a new user account",
      icon: UsersIcon,
      action: () => router.push('/dashboard/users'),
      variant: "default"
    },
    {
      title: "System Backup",
      description: "Run manual backup",
      icon: DatabaseIcon,
      action: () => router.push('/dashboard/backup'),
      variant: "outline"
    },
    {
      title: "Export Logs",
      description: "Download activity logs",
      icon: DownloadIcon,
      action: () => {},
      variant: "outline",
      isDropdown: true
    },
    {
      title: "System Settings",
      description: "Configure system",
      icon: SettingsIcon,
      action: () => router.push('/dashboard/settings'),
      variant: "secondary"
    }
  ];

  const getHealthStatus = (status: string) => {
    switch (status) {
      case "healthy":
        return { color: "text-green-600", bg: "bg-green-100", icon: CheckCircleIcon };
      case "warning":
        return { color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertTriangleIcon };
      case "error":
        return { color: "text-red-600", bg: "bg-red-100", icon: AlertTriangleIcon };
      default:
        return { color: "text-gray-600", bg: "bg-gray-100", icon: CheckCircleIcon };
    }
  };

  const getActivityStatus = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Quick Actions */}
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
        <CardHeader className="relative bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-slate-200/50 dark:border-slate-700/50">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <TrendingUpIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-base">
            Streamlined access to essential administrative functions
          </CardDescription>
        </CardHeader>
        <CardContent className="relative p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const gradients = [
                "from-blue-500 to-indigo-500",
                "from-emerald-500 to-green-500",
                "from-purple-500 to-violet-500",
                "from-orange-500 to-red-500"
              ];
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradients[index]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  {action.isDropdown ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative w-full h-auto p-6 flex flex-col items-center space-y-4 text-center hover:bg-transparent"
                        >
                          <div className={`p-4 rounded-xl bg-gradient-to-r ${gradients[index]} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              {action.title}
                              <ChevronDownIcon className="h-3 w-3" />
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{action.description}</div>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExportLogs('text')}>
                          Export as Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportLogs('pdf')}>
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportLogs('excel')}>
                          Export as Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportLogs('csv')}>
                          Export as CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      className="relative w-full h-auto p-6 flex flex-col items-center space-y-4 text-center hover:bg-transparent"
                      onClick={action.action}
                      disabled={action.title === "System Backup" && isBackupLoading}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-r ${gradients[index]} shadow-lg group-hover:scale-110 transition-transform duration-300 ${action.title === "System Backup" && isBackupLoading ? 'animate-pulse' : ''}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {action.title === "System Backup" && isBackupLoading ? "Creating Backup..." : action.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{action.description}</div>
                      </div>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Enhanced System Health */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5" />
          <CardHeader className="relative bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-b border-slate-200/50 dark:border-slate-700/50">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                <ServerIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold">System Health</span>
            </CardTitle>
            <CardDescription className="text-base">
              Real-time system status and performance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="relative p-6 space-y-6">
            {/* Enhanced Health Indicators */}
            <div className="space-y-4">
              {[
                { name: "Database", status: systemHealth.database },
                { name: "Server", status: systemHealth.server },
                { name: "Storage", status: systemHealth.storage }
              ].map((item, index) => {
                const health = getHealthStatus(item.status);
                const Icon = health.icon;
                return (
                  <div key={index} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${health.bg} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`h-4 w-4 ${health.color}`} />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>
                    </div>
                    <Badge 
                      className={`${
                        item.status === "healthy" 
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0" 
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0"
                      } shadow-md`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Performance Metrics */}
            <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Memory Usage</span>
                  <span className="text-slate-900 dark:text-slate-100">{systemHealth.memory}%</span>
                </div>
                <div className="relative">
                  <Progress value={systemHealth.memory} className="h-3 bg-slate-200 dark:bg-slate-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700 dark:text-slate-300">CPU Usage</span>
                  <span className="text-slate-900 dark:text-slate-100">{systemHealth.cpu}%</span>
                </div>
                <div className="relative">
                  <Progress value={systemHealth.cpu} className="h-3 bg-slate-200 dark:bg-slate-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Uptime</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{systemHealth.uptime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5" />
          <CardHeader className="relative bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold">Recent Activity</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Live feed of system and user activities
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="hover:bg-white/50 dark:hover:bg-slate-700/50">
                <RefreshCwIcon className="h-4 w-4 hover:animate-spin" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="group flex items-center space-x-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:shadow-md"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInLeft 0.5s ease-out forwards'
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${getActivityStatus(activity.status)} shadow-lg group-hover:scale-125 transition-transform duration-200`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {activity.action}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                      <span className="font-medium">{activity.user}</span> • {activity.time}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getActivityStatus(activity.status)} opacity-50`} />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-slate-200/50 dark:border-slate-600/50 hover:shadow-md transition-all duration-200"
                onClick={() => router.push('/dashboard/activity')}
              >
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}