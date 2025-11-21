"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTime } from '@/context/RealTimeContext';
import { Activity, Users, DollarSign, TrendingUp, Bell, Wifi, WifiOff } from 'lucide-react';
import RealTimeChart from '@/components/RealTimeChart';

interface RealTimeMetrics {
  activeUsers: number;
  totalRevenue: number;
  ordersToday: number;
  systemLoad: number;
  lastUpdated: string;
}

export default function RealTimePage() {
  const { isConnected } = useRealTime();
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    totalRevenue: 0,
    ordersToday: 0,
    systemLoad: 0,
    lastUpdated: new Date().toISOString()
  });
  const [notifications] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    user?: string;
  }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 1000),
        ordersToday: prev.ordersToday + Math.floor(Math.random() * 3),
        systemLoad: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toISOString()
      }));

      const activities = ['New user registered', 'Order completed', 'Payment processed'];
      setRecentActivities(prev => [
        {
          id: Date.now().toString(),
          message: activities[Math.floor(Math.random() * activities.length)],
          timestamp: new Date().toISOString(),
          user: `User${Math.floor(Math.random() * 100)}`
        },
        ...prev.slice(0, 9)
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real-Time Dashboard</h1>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Disconnected</span>
            </div>
          )}
          <Badge variant="outline">Last updated: {formatTime(metrics.lastUpdated)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Today's earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ordersToday}</div>
            <p className="text-xs text-muted-foreground">New orders processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemLoad}%</div>
            <p className="text-xs text-muted-foreground">Current usage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Bell className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-400' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{activity.message}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</span>
                    </div>
                    {activity.user && <p className="text-xs text-muted-foreground">by {activity.user}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <RealTimeChart />
    </div>
  );
}