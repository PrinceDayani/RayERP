"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Upload } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";
import { PERMISSIONS } from "@/lib/permissions";
import { PermissionGate } from "@/components/PermissionGate";

export default function BackupManagementTab() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBackups();
      setBackups(response.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch backups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      await adminAPI.createBackup();
      toast({ title: "Success", description: "Backup created" });
      fetchBackups();
    } catch (error) {
      toast({ title: "Error", description: "Backup failed", variant: "destructive" });
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm("Are you sure? This will restore the system to this backup.")) return;
    try {
      await adminAPI.restoreBackup(backupId);
      toast({ title: "Success", description: "Restore initiated" });
    } catch (error) {
      toast({ title: "Error", description: "Restore failed", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Backup Management</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBackups}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <PermissionGate permission={PERMISSIONS.CREATE_BACKUP}>
              <Button size="sm" onClick={handleCreateBackup}>
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </PermissionGate>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : backups.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">No backups found</TableCell></TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{backup.size || "N/A"}</TableCell>
                  <TableCell><Badge>{backup.status}</Badge></TableCell>
                  <TableCell>
                    <PermissionGate permission={PERMISSIONS.RESTORE_BACKUP}>
                      <Button variant="outline" size="sm" onClick={() => handleRestore(backup.id)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
