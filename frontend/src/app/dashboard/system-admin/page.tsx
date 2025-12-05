"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Database, Bell, Download } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { PERMISSIONS } from "@/lib/permissions";
import SystemLogsTab from "@/components/system-admin/SystemLogsTab";
import AuditTrailTab from "@/components/system-admin/AuditTrailTab";
import BackupManagementTab from "@/components/system-admin/BackupManagementTab";
import NotificationSettingsTab from "@/components/system-admin/NotificationSettingsTab";
import DataExportTab from "@/components/system-admin/DataExportTab";
import PermissionManagementTab from "@/components/system-admin/PermissionManagementTab";

export default function SystemAdminPage() {
  const [activeTab, setActiveTab] = useState("logs");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Manage system settings, logs, backups, and permissions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <PermissionGate permission={PERMISSIONS.VIEW_LOGS}>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.VIEW_AUDIT}>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.VIEW_BACKUPS}>
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backups
            </TabsTrigger>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_NOTIFICATIONS}>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.EXPORT_DATA}>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_PERMISSIONS}>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </PermissionGate>
        </TabsList>

        <PermissionGate permission={PERMISSIONS.VIEW_LOGS}>
          <TabsContent value="logs"><SystemLogsTab /></TabsContent>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.VIEW_AUDIT}>
          <TabsContent value="audit"><AuditTrailTab /></TabsContent>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.VIEW_BACKUPS}>
          <TabsContent value="backups"><BackupManagementTab /></TabsContent>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.MANAGE_NOTIFICATIONS}>
          <TabsContent value="notifications"><NotificationSettingsTab /></TabsContent>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.EXPORT_DATA}>
          <TabsContent value="export"><DataExportTab /></TabsContent>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.MANAGE_PERMISSIONS}>
          <TabsContent value="permissions"><PermissionManagementTab /></TabsContent>
        </PermissionGate>
      </Tabs>
    </div>
  );
}
