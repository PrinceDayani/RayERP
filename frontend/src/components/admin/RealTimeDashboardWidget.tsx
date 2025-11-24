"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Users, Database, Server, Zap, 
  TrendingUp, TrendingDown, Minus, RefreshCw 
} from "lucide-react";
import { useSocketEvent } from '@/lib/socket';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

interface MetricData {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
}

interface RealTimeMetrics {
  activeUsers: MetricData;
  systemLoad: MetricData;
  memoryUsage: MetricData;
  cpuUsage: MetricData;
  networkActivity: MetricData;
  databaseConnections: MetricData;
}

interface DashboardWidgetProps {
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

export function RealTimeDashboardWidget({ 
  className = "", 
  showControls = true,
  compact = false 
}: DashboardWidgetProps) {
  const { permissions } = useAdminPermissions();
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() },
    systemLoad: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() },
    memoryUsage: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() },
    cpuUsage: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() },
    networkActivity: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() },
    databaseConnections: { value: 0, change: 0, trend: 'stable', timestamp: new Date().toISOString() }
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Listen for real-time metrics updates
  useSocketEvent<any>('admin:metrics', (data) => {
    if (!permissions.canViewSystemMetrics) return;
    
    setMetrics(prevMetrics => {
      const newMetrics = { ...prevMetrics };
      
      // Update each metric with trend calculation
      Object.keys(data).forEach(key => {
        if (newMetrics[key as keyof RealTimeMetrics]) {
          const oldValue = newMetrics[key as keyof RealTimeMetrics].value;
          const newValue = data[key];
          const change = newValue - oldValue;
          const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
          
          newMetrics[key as keyof RealTimeMetrics] = {
            value: newValue,
            change: Math.abs(change),
            trend,
            timestamp: new Date().toISOString()
          };
        }
      });
      
      return newMetrics;
    });
    
    setLastUpdate(new Date().toLocaleTimeString());
    setIsConnected(true);
  });

  // Connection status monitoring
  useSocketEvent('connect', () => setIsConnected(true));
  useSocketEvent('disconnect', () => setIsConnected(false));

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (value: number, type: 'percentage' | 'count' = 'percentage') => {
    if (type === 'count') return 'text-blue-600';
    
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatValue = (value: number, type: 'percentage' | 'count' | 'bytes' = 'count') => {
    switch (type) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'bytes':
        return value > 1024 ? `${(value / 1024).toFixed(1)}KB` : `${value}B`;
      default:
        return value.toString();
    }
  };

  if (!permissions.canViewSystemMetrics) {
    return null;
  }

  if (compact) {
    return (
      <Card className={`${className} border-l-4 border-l-blue-500`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="font-medium">System Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className={`font-bold ${getStatusColor(metrics.cpuUsage.value)}`}>
                {formatValue(metrics.cpuUsage.value, 'percentage')}
              </div>
              <div className="text-xs text-muted-foreground">CPU</div>
            </div>
            <div className="text-center">
              <div className={`font-bold ${getStatusColor(metrics.memoryUsage.value)}`}>
                {formatValue(metrics.memoryUsage.value, 'percentage')}
              </div>
              <div className="text-xs text-muted-foreground">Memory</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">
                {formatValue(metrics.activeUsers.value)}
              </div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Real-Time System Metrics</span>
            </CardTitle>
            <CardDescription>
              Live system performance and user activity monitoring
            </CardDescription>
          </div>
          {showControls && (
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Active Users</span>
              </div>
              {getTrendIcon(metrics.activeUsers.trend)}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatValue(metrics.activeUsers.value)}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.activeUsers.change > 0 && `±${metrics.activeUsers.change} from last update`}
            </div>
          </div>

          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              {getTrendIcon(metrics.cpuUsage.trend)}
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.cpuUsage.value)}`}>
              {formatValue(metrics.cpuUsage.value, 'percentage')}
            </div>
            <Progress value={metrics.cpuUsage.value} className="h-2" />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              {getTrendIcon(metrics.memoryUsage.trend)}
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.memoryUsage.value)}`}>
              {formatValue(metrics.memoryUsage.value, 'percentage')}
            </div>
            <Progress value={metrics.memoryUsage.value} className="h-2" />
          </div>

          {/* System Load */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">System Load</span>
              </div>
              {getTrendIcon(metrics.systemLoad.trend)}
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.systemLoad.value)}`}>
              {formatValue(metrics.systemLoad.value, 'percentage')}
            </div>
            <Progress value={metrics.systemLoad.value} className="h-2" />
          </div>

          {/* Network Activity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Network Activity</span>
              </div>
              {getTrendIcon(metrics.networkActivity.trend)}
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatValue(metrics.networkActivity.value, 'bytes')}
            </div>
            <div className="text-xs text-muted-foreground">
              Data throughput
            </div>
          </div>

          {/* Database Connections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">DB Connections</span>
              </div>
              {getTrendIcon(metrics.databaseConnections.trend)}
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatValue(metrics.databaseConnections.value)}
            </div>
            <div className="text-xs text-muted-foreground">
              Active connections
            </div>
          </div>
        </div>

        {lastUpdate && (
          <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
            Last updated: {lastUpdate}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
