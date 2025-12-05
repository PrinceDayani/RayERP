"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, RefreshCw } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";
import { PERMISSIONS } from "@/lib/permissions";
import { PermissionGate } from "@/components/PermissionGate";

export default function SystemLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ level: "all", search: "" });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSystemLogs(filters.level !== "all" ? { level: filters.level } : {});
      setLogs(response.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.level]);

  const handleExport = async () => {
    try {
      await adminAPI.exportSystemLogs({ format: "csv" });
      toast({ title: "Success", description: "Export started" });
    } catch (error) {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  };

  const getLevelColor = (level: string) => {
    const colors: any = { error: "destructive", warn: "warning", info: "default" };
    return colors[level] || "default";
  };

  const filteredLogs = logs.filter(log => 
    !filters.search || log.message.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <PermissionGate permission={PERMISSIONS.EXPORT_LOGS}>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </PermissionGate>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full"
            />
          </div>
          <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">No logs found</TableCell></TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={getLevelColor(log.level)}>{log.level}</Badge></TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell className="max-w-md truncate">{log.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
