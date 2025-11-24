"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserManagement } from "@/components/admin/UserManagement";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { UnifiedRoleManagement } from "@/components/admin/UnifiedRoleManagement";
import RoleGuard from "@/components/RoleGuard";
import { UserRole } from "@/contexts/AuthContext";
import { ShieldIcon, UsersIcon, SettingsIcon, ActivityIcon, LayoutDashboardIcon } from "lucide-react";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RoleGuard minimumRole={UserRole.ADMIN}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Control Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and system settings
            </p>
          </div>
          <Badge variant="outline">Administrator</Badge>
        </div>

        <AdminStats isLoading={isLoading} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <LayoutDashboardIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center space-x-2">
              <ShieldIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <ActivityIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <AdminOverview isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Create, edit, and manage user accounts with permission controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldIcon className="h-5 w-5" />
                  <span>Role & Permission Management</span>
                </CardTitle>
                <CardDescription>
                  Define custom roles, set permissions, and manage access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnifiedRoleManagement isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>System Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure application settings, security policies, and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemSettings isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="h-5 w-5" />
                  <span>Activity Monitoring</span>
                </CardTitle>
                <CardDescription>
                  Real-time tracking of user actions, system events, and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogs isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
