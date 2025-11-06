"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { useSocket } from '@/hooks/useSocket';
import { Settings, User, Bell, Palette, Shield, Wifi, WifiOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const socket = useSocket();

  // Monitor socket connection
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setLastSync(new Date());
      toast.success('Real-time sync enabled');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error('Real-time sync disconnected');
    };

    const handleSettingsSync = (data: any) => {
      setLastSync(new Date());
      toast.success('Settings synced across devices');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('settings:synced', handleSettingsSync);

    if (socket.connected) {
      setIsConnected(true);
      setLastSync(new Date());
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('settings:synced', handleSettingsSync);
    };
  }, [socket]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Emit tab change for analytics
    if (socket) {
      socket.emit('settings:tab_changed', { tab: value, timestamp: new Date() });
    }
  };

  const syncSettings = () => {
    if (socket) {
      socket.emit('settings:force_sync', { timestamp: new Date() });
      toast.loading('Syncing settings...', { duration: 2000 });
    } else {
      toast.error('Cannot sync - not connected to server');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences with real-time sync
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Offline
                </Badge>
              </>
            )}
          </div>
          
          {/* Sync Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncSettings}
            disabled={!isConnected}
          >
            Sync Now
          </Button>
        </div>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          Last synced: {lastSync.toLocaleString()}
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}