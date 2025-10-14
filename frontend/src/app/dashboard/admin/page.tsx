"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { AdminStats } from "@/components/admin/AdminStats";
import { UnifiedRoleManagement } from "@/components/admin/UnifiedRoleManagement";
import RoleGuard from "@/components/RoleGuard";
import { UserRole } from "@/contexts/AuthContext";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading admin data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <RoleGuard minimumRole={UserRole.ADMIN}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        </div>

        <div className="mb-8">
          <AdminStats isLoading={isLoading} />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and their basic information</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>Create roles, manage permissions, and assign roles to users</CardDescription>
              </CardHeader>
              <CardContent>
                <UnifiedRoleManagement isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure application settings</CardDescription>
              </CardHeader>
              <CardContent>
                <SystemSettings isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>Monitor system activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogs isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  ); }