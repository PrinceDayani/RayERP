"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { useSocket } from '@/hooks/useSocket';
import { Settings, User, Bell, Palette, Shield, Wifi, WifiOff, Search, Command, ArrowLeft, Sparkles, Globe, IndianRupee, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import HierarchySettings from '@/components/settings/HierarchySettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [accountingMode, setAccountingMode] = useState<"western" | "indian">("western");
  const [switchingMode, setSwitchingMode] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    fetchAccountingMode();
  }, []);

  const fetchAccountingMode = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAccountingMode(data.accountingMode || "western");
    } catch (error) {
      console.error("Failed to fetch accounting mode", error);
    }
  };

  const toggleAccountingMode = async () => {
    setSwitchingMode(true);
    const newMode = accountingMode === "western" ? "indian" : "western";
    try {
      const token = localStorage.getItem("token");
      const endpoint = newMode === "indian" 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/accounting-settings/convert-to-indian`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/accounting-settings/convert-to-western`;
      
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAccountingMode(newMode);
      toast.success(`Switched to ${newMode === "indian" ? "Indian" : "Western"} accounting mode`);
    } catch (error) {
      toast.error("Failed to switch accounting mode");
    } finally {
      setSwitchingMode(false);
    }
  };

  // Monitor socket connection
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setLastSync(new Date());
      toast.success('Real-time sync enabled', { icon: '🔄' });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error('Real-time sync disconnected');
    };

    const handleSettingsSync = (data: any) => {
      setLastSync(new Date());
      toast.success('Settings synced', { icon: '✨', duration: 2000 });
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Cmd/Ctrl + 1-5 for tab navigation
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const tabs = ['profile', 'notifications', 'appearance', 'security', 'hierarchy'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
      // Escape to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-right" toastOptions={{
        className: 'backdrop-blur-sm',
        style: { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }
      }} />
      
      <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
        {/* Header with Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
          <Card className="relative border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <Settings className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Settings
                      </h1>
                      <p className="text-muted-foreground text-sm mt-1">
                        Customize your experience with real-time sync
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Toggle */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      <Command className="h-3 w-3" />K
                    </kbd>
                  </Button>
                  
                  {/* Connection Status */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
                    {isConnected ? (
                      <>
                        <div className="relative">
                          <Wifi className="h-4 w-4 text-green-600" />
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        </div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">Offline</span>
                      </>
                    )}
                  </div>
                  
                  {/* Accounting Mode Toggle */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleAccountingMode}
                    disabled={switchingMode}
                    className="gap-2 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all"
                  >
                    {accountingMode === "indian" ? (
                      <><IndianRupee className="h-4 w-4" /> Indian</>
                    ) : (
                      <><Globe className="h-4 w-4" /> Western</>
                    )}
                  </Button>
                  
                  {/* Sync Button */}
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={syncSettings}
                    disabled={!isConnected}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Sync
                  </Button>
                </div>
              </div>
              
              {/* Search Bar */}
              {showSearch && (
                <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search settings... (Press ESC to close)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Last Sync Info */}
        {lastSync && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-4 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4" />
            <span>Last synced: {lastSync.toLocaleString()}</span>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange}>
          <div className="sticky top-4 z-10 mb-8">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full max-w-5xl mx-auto p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border shadow-xl rounded-2xl">
              <TabsTrigger 
                value="profile" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 relative group"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
                <kbd className="hidden lg:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘1
                </kbd>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 relative group"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                <kbd className="hidden lg:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘2
                </kbd>
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 relative group"
              >
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
                <kbd className="hidden lg:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘3
                </kbd>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 relative group"
              >
                <Shield className="h-4 w-4" />
                <span>Security</span>
                <kbd className="hidden lg:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘4
                </kbd>
              </TabsTrigger>
              <TabsTrigger 
                value="hierarchy" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl transition-all duration-300 relative group"
              >
                <Users className="h-4 w-4" />
                <span>Hierarchy</span>
                <kbd className="hidden lg:inline-flex ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  ⌘5
                </kbd>
              </TabsTrigger>
            </TabsList>
          </div>
        
          <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Profile Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Manage your personal information and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ProfileSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  Appearance Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Customize the look and feel of your application
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <AppearanceSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  Security Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <SecuritySettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hierarchy" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Organization Hierarchy
                </CardTitle>
                <CardDescription className="text-base">
                  View and contact users with higher roles in your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <HierarchySettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Keyboard Shortcuts Help */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border shadow-sm font-mono text-xs">⌘K</kbd>
                <span>Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border shadow-sm font-mono text-xs">⌘1-5</kbd>
                <span>Switch tabs</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border shadow-sm font-mono text-xs">ESC</kbd>
                <span>Close search</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}