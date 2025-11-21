"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Users, Shield, Activity, Database, Server, AlertTriangle, 
  CheckCircle, TrendingUp, Eye, Settings, Zap, Clock,
  UserCheck, UserX, Lock, Unlock, RefreshCw
} from "lucide-react";
import { useRealTime } from '@/context/RealTimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketEvent } from '@/lib/socket';
import adminAPI from '@/lib/api/adminAPI';

interface RealTimeMetrics {
  activeUsers: number;
  totalSessions: number;
  systemLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  networkActivity: number;
  lastUpdated: string;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  ipAddress: string;
}

interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PermissionCheck {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewLogs: boolean;
  canManageSystem: boolean;
  canViewMetrics: boolean;
}

export function RealTimeAdminPanel() {
  const { user } = useAuth();
  const { isConnected } = useRealTime();
  
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    systemLoad: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkActivity: 0,
    lastUpdated: new Date().toISOString()
  });
  
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [permissions, setPermissions] = useState<PermissionCheck>({
    canViewUsers: false,
    canManageUsers: false,
    canViewLogs: false,
    canManageSystem: false,
    canViewMetrics: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check user permissions
  useEffect(() => {
    const checkPermissions = () => {
      const userRole = user?.role ? String(user.role).toLowerCase() : '';
      const isAdmin = ['admin', 'super_admin', 'root'].includes(userRole);
      
      setPermissions({
        canViewUsers: isAdmin,
        canManageUsers: isAdmin,
        canViewLogs: isAdmin,
        canManageSystem: isAdmin,
        canViewMetrics: isAdmin
      });
    };

    if (user) {
      checkPermissions();
    }
  }, [user]);

  // Real-time metrics updates
  useSocketEvent<RealTimeMetrics>('admin:metrics', (data) => {
    if (permissions.canViewMetrics) {
      setMetrics(data);
    }
  });

  // Real-time activity updates
  useSocketEvent<UserActivity>('admin:activity', (data) => {
    if (permissions.canViewLogs) {
      setActivities(prev => [data, ...prev.slice(0, 49)]);
    }
  });

  // Real-time alerts
  useSocketEvent<SystemAlert>('admin:alert', (data) => {
    if (permissions.canViewLogs) {
      setAlerts(prev => [data, ...prev]);
    }
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const promises = [];
        if (permissions.canViewMetrics) {
          promises.push(adminAPI.getStats().catch((err) => {
            if (err.status === 403 || err.status === 401) {
              setPermissions(prev => ({ ...prev, canViewMetrics: false }));
            }
            return null;
          }));
        } else {
          promises.push(Promise.resolve(null));
        }
        if (permissions.canViewLogs) {
          promises.push(adminAPI.getLogs({ limit: 50 }).catch((err) => {
            if (err.status === 403 || err.status === 401) {
              setPermissions(prev => ({ ...prev, canViewLogs: false }));
            }
            return [];
          }));
        } else {
          promises.push(Promise.resolve([]));
        }
        
        const [statsData, logsData] = await Promise.all(promises);

        if (statsData && permissions.canViewMetrics && typeof statsData === 'object' && 'activeUsers' in statsData) {
          setMetrics(prev => ({
            ...prev,
            activeUsers: statsData.activeUsers || 0,
            totalSessions: statsData.totalUsers || 0,
            lastUpdated: new Date().toISOString()
          }));
        }

        if (logsData && permissions.canViewLogs && Array.isArray(logsData)) {
          const formattedActivities = logsData.map((log: any) => ({
            id: log.id,
            userId: log.userId || 'system',
            userName: log.user,
            action: log.action,
            resource: log.resource,
            timestamp: log.timestamp,
            status: log.status,
            ipAddress: log.ipAddress
          }));
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user, permissions]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !permissions.canViewMetrics) return;

    const interval = setInterval(async () => {
      try {
        const stats = await adminAPI.getStats();
        setMetrics(prev => ({
          ...prev,
          activeUsers: stats.activeUsers || prev.activeUsers,
          totalSessions: stats.totalUsers || prev.totalSessions,
          lastUpdated: new Date().toISOString()
        }));
      } catch (error) {
        console.warn('Auto-refresh failed, retrying...', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, permissions.canViewMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Please log in to access the admin panel.</AlertDescription>
      </Alert>
    );
  }

  if (!Object.values(permissions).some(Boolean)) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>You don't have permission to access the admin panel.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Admin Panel</h1>
          <p className="text-muted-foreground">Monitor system activity and manage users in real-time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              disabled={!permissions.canViewMetrics}
            />
            <span className="text-sm">Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      {permissions.canViewMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalSessions} total sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Load</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemLoad}%</div>
              <Progress value={metrics.systemLoad} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.memoryUsage}%</div>
              <Progress value={metrics.memoryUsage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cpuUsage}%</div>
              <Progress value={metrics.cpuUsage} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          {permissions.canViewLogs && <TabsTrigger value="activity">Live Activity</TabsTrigger>}
          {permissions.canViewLogs && <TabsTrigger value="alerts">System Alerts</TabsTrigger>}
          {permissions.canViewUsers && <TabsTrigger value="users">User Management</TabsTrigger>}
          {permissions.canManageSystem && <TabsTrigger value="system">System Control</TabsTrigger>}
        </TabsList>

        {/* Live Activity Tab */}
        {permissions.canViewLogs && (
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Live User Activity</span>
                  <Badge variant="secondary">{activities.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Real-time feed of user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activities.map((activity, index) => (
                    <div
                      key={`${activity.id}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(activity.status)}`} />
                        <div>
                          <div className="font-medium">{activity.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.action} on {activity.resource}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* System Alerts Tab */}
        {permissions.canViewLogs && (
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>System Alerts</span>
                  <Badge variant="destructive">
                    {alerts.filter(a => !a.resolved).length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Critical system notifications and security alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.filter(a => !a.resolved).map((alert, index) => (
                    <div
                      key={`${alert.id}-${index}`}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.type} • {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                  {alerts.filter(a => !a.resolved).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      No active alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* User Management Tab */}
        {permissions.canViewUsers && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  User management interface will be loaded here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* System Control Tab */}
        {permissions.canManageSystem && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>System Control</span>
                </CardTitle>
                <CardDescription>
                  System maintenance and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="h-20 flex-col">
                    <Database className="h-6 w-6 mb-2" />
                    Database Backup
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    System Restart
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Shield className="h-6 w-6 mb-2" />
                    Security Scan
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Performance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}