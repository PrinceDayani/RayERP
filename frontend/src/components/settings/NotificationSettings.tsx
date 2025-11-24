"use client";

import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { CheckCircle, Bell, Mail, Package, TrendingUp, Users, AlertTriangle, Calendar, Coins, FileText, Settings, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const socket = useSocket();
  const { sendTestNotification: sendTest } = useNotifications();
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [testNotification, setTestNotification] = useState(false);

  // Core notification settings
  const [emailNotifications, setEmailNotifications, emailLoading] = useRealTimeSetting('emailNotifications', true);
  const [pushNotifications, setPushNotifications, pushLoading] = useRealTimeSetting('pushNotifications', true);
  const [soundEnabled, setSoundEnabled, soundLoading] = useRealTimeSetting('soundEnabled', true);
  
  // Business notifications
  const [orderNotifications, setOrderNotifications, orderLoading] = useRealTimeSetting('orderNotifications', true);
  const [inventoryAlerts, setInventoryAlerts, inventoryLoading] = useRealTimeSetting('inventoryAlerts', true);
  const [projectUpdates, setProjectUpdates, projectLoading] = useRealTimeSetting('projectUpdates', true);
  const [taskReminders, setTaskReminders, taskLoading] = useRealTimeSetting('taskReminders', true);
  const [budgetAlerts, setBudgetAlerts, budgetLoading] = useRealTimeSetting('budgetAlerts', true);
  
  // Report notifications
  const [dailyReports, setDailyReports, dailyLoading] = useRealTimeSetting('dailyReports', false);
  const [weeklyReports, setWeeklyReports, weeklyLoading] = useRealTimeSetting('weeklyReports', true);
  const [monthlyReports, setMonthlyReports, monthlyLoading] = useRealTimeSetting('monthlyReports', true);
  
  // System notifications
  const [systemAlerts, setSystemAlerts, systemLoading] = useRealTimeSetting('systemAlerts', true);
  const [securityAlerts, setSecurityAlerts, securityLoading] = useRealTimeSetting('securityAlerts', true);
  const [maintenanceNotices, setMaintenanceNotices, maintenanceLoading] = useRealTimeSetting('maintenanceNotices', true);
  
  const isLoading = emailLoading || pushLoading || soundLoading || orderLoading || inventoryLoading || 
                   projectLoading || taskLoading || budgetLoading || dailyLoading || weeklyLoading || 
                   monthlyLoading || systemLoading || securityLoading || maintenanceLoading;
  
  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleToggle = (setter: (value: boolean) => void) => (checked: boolean) => {
    setter(checked);
    showSaveIndicator();
    
    // Emit real-time update
    if (socket) {
      socket.emit('settings:updated', { type: 'notifications', timestamp: new Date() });
    }
  };

  const sendTestNotification = () => {
    setTestNotification(true);
    toast.success('Test notification sent! Check your notification panel.');
    
    sendTest();
    
    setTimeout(() => setTestNotification(false), 3000);
  };

  // Listen for real-time notification updates
  useEffect(() => {
    if (!socket) return;

    const handleNotificationReceived = (data: any) => {
      if (soundEnabled) {
        // Play notification sound
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(() => {});
      }
    };

    socket.on('notification:received', handleNotificationReceived);
    
    return () => {
      socket.off('notification:received', handleNotificationReceived);
    };
  }, [socket, soundEnabled]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Auto-save indicator */}
      {saveIndicator && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          <CheckCircle className="h-4 w-4" />
          Settings saved automatically
        </div>
      )}

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send a test notification to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={sendTestNotification} 
            disabled={testNotification}
            className="w-full sm:w-auto"
          >
            {testNotification ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Core Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Core Settings
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleToggle(setEmailNotifications)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Browser push notifications</p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={handleToggle(setPushNotifications)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Sound Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Play sound for new notifications</p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleToggle(setSoundEnabled)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Business Notifications
          </CardTitle>
          <CardDescription>
            Stay updated on business activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Updates
              </Label>
              <p className="text-sm text-muted-foreground">New orders, status changes, and deliveries</p>
            </div>
            <Switch
              checked={orderNotifications}
              onCheckedChange={handleToggle(setOrderNotifications)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Inventory Alerts
              </Label>
              <p className="text-sm text-muted-foreground">Low stock warnings and inventory updates</p>
            </div>
            <Switch
              checked={inventoryAlerts}
              onCheckedChange={handleToggle(setInventoryAlerts)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Project Updates
              </Label>
              <p className="text-sm text-muted-foreground">Project milestones and team updates</p>
            </div>
            <Switch
              checked={projectUpdates}
              onCheckedChange={handleToggle(setProjectUpdates)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Task Reminders
              </Label>
              <p className="text-sm text-muted-foreground">Due dates and task assignments</p>
            </div>
            <Switch
              checked={taskReminders}
              onCheckedChange={handleToggle(setTaskReminders)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Budget Alerts
              </Label>
              <p className="text-sm text-muted-foreground">Budget overruns and financial warnings</p>
            </div>
            <Switch
              checked={budgetAlerts}
              onCheckedChange={handleToggle(setBudgetAlerts)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Notifications
          </CardTitle>
          <CardDescription>
            Automated report delivery schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Daily Reports
              </Label>
              <p className="text-sm text-muted-foreground">Daily performance summaries</p>
            </div>
            <Switch
              checked={dailyReports}
              onCheckedChange={handleToggle(setDailyReports)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Weekly Reports
              </Label>
              <p className="text-sm text-muted-foreground">Weekly analytics and insights</p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={handleToggle(setWeeklyReports)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Reports
              </Label>
              <p className="text-sm text-muted-foreground">Comprehensive monthly analysis</p>
            </div>
            <Switch
              checked={monthlyReports}
              onCheckedChange={handleToggle(setMonthlyReports)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Notifications
          </CardTitle>
          <CardDescription>
            System status and security alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                System Alerts
              </Label>
              <p className="text-sm text-muted-foreground">System errors and performance issues</p>
            </div>
            <Switch
              checked={systemAlerts}
              onCheckedChange={handleToggle(setSystemAlerts)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security Alerts
              </Label>
              <p className="text-sm text-muted-foreground">Login attempts and security events</p>
            </div>
            <Switch
              checked={securityAlerts}
              onCheckedChange={handleToggle(setSecurityAlerts)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Maintenance Notices
              </Label>
              <p className="text-sm text-muted-foreground">Scheduled maintenance and updates</p>
            </div>
            <Switch
              checked={maintenanceNotices}
              onCheckedChange={handleToggle(setMaintenanceNotices)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">Real-time Updates Enabled</span>
        </div>
        All notification preferences are saved automatically and synced in real-time across your devices.
      </div>
    </div>
  );
}
