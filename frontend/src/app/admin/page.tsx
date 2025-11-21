"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserManagement } from "@/components/admin/UserManagement";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { UnifiedRoleManagement } from "@/components/admin/UnifiedRoleManagement";
import { ShieldIcon, UsersIcon, SettingsIcon, ActivityIcon, LayoutDashboardIcon, AlertTriangle } from "lucide-react";

const AdminControls = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const isRoot = userRole === "root";
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const hasAdminAccess = isAdmin || isSuperAdmin || isRoot;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Admin access required
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }



  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-600 rounded-lg">
                  <ShieldIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Admin Control Panel
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage users, roles, settings, and monitor system activity
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {typeof user?.role === 'string' ? user.role : user?.role?.name || 'N/A'}
              </Badge>
            </div>
          </div>

          <div className="mb-8">
            <AdminStats isLoading={isLoading} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-white dark:bg-slate-800 shadow-sm">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <LayoutDashboardIcon className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <UsersIcon className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center space-x-2">
                <ShieldIcon className="h-4 w-4" />
                <span>Roles</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center space-x-2">
                <ActivityIcon className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <AdminOverview isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
                <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5 text-red-600" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription>
                    Create, edit, and manage user accounts and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UserManagement isLoading={isLoading} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="roles" className="space-y-6">
              <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
                <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldIcon className="h-5 w-5 text-green-600" />
                    <span>Role & Permission Management</span>
                  </CardTitle>
                  <CardDescription>
                    Define roles, set permissions, and assign them to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UnifiedRoleManagement isLoading={isLoading} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
                <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5 text-purple-600" />
                    <span>System Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Configure application settings, security, and system preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <SystemSettings isLoading={isLoading} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-6">
              <Card className="shadow-sm border-0 bg-white dark:bg-slate-800">
                <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center space-x-2">
                    <ActivityIcon className="h-5 w-5 text-orange-600" />
                    <span>Activity Monitoring</span>
                  </CardTitle>
                  <CardDescription>
                    Track user actions, system events, and security activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ActivityLogs isLoading={isLoading} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminControls;
