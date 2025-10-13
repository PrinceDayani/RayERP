"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Settings, 
  Database, 
  Activity, 
  AlertTriangle,
  Lock,
  Key,
  Server,
  FileText
} from "lucide-react";

const AdminControls = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isRoot = user?.role === "root";
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const hasAdminAccess = isAdmin || isSuperAdmin || isRoot;

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to access Admin Controls</p>
              <Button onClick={() => router.push("/login")}>Login</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access Admin Controls
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      items: [
        { name: "User Accounts", path: "/admin/users", description: "View and manage user accounts" },
        { name: "Role Management", path: "/admin/roles", description: "Configure user roles and permissions" },
        { name: "Access Control", path: "/admin/access", description: "Manage access permissions" },
      ]
    },
    {
      title: "System Configuration",
      description: "Configure system settings and preferences",
      icon: Settings,
      items: [
        { name: "System Settings", path: "/admin/system", description: "Configure global system settings" },
        { name: "Email Configuration", path: "/admin/email", description: "Setup email server and templates" },
        { name: "API Settings", path: "/admin/api", description: "Manage API keys and configurations" },
      ]
    },
    {
      title: "Database Management",
      description: "Database operations and maintenance",
      icon: Database,
      items: [
        { name: "Database Status", path: "/admin/database", description: "Monitor database health and performance" },
        { name: "Backup & Restore", path: "/admin/backup", description: "Manage database backups" },
        { name: "Data Migration", path: "/admin/migration", description: "Handle data migrations" },
      ]
    },
    {
      title: "Security & Monitoring",
      description: "Security settings and system monitoring",
      icon: Shield,
      items: [
        { name: "Security Logs", path: "/admin/security", description: "View security events and logs" },
        { name: "System Monitoring", path: "/admin/monitoring", description: "Monitor system performance" },
        { name: "Audit Trail", path: "/admin/audit", description: "View system audit logs" },
      ]
    }
  ];

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Controls</h1>
            <p className="text-muted-foreground">
              System administration and configuration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <p className="text-2xl font-bold text-green-600">Online</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Level</p>
                  <p className="text-2xl font-bold text-green-600">High</p>
                </div>
                <Lock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Server Load</p>
                  <p className="text-2xl font-bold">45%</p>
                </div>
                <Server className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adminSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(item.path)}
                    >
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Database className="h-6 w-6" />
                <span>Backup Database</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Key className="h-6 w-6" />
                <span>Reset API Keys</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminControls;