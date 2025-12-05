"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

export default function AuditTrailTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditTrail = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAuditTrail();
      setLogs(response.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch audit trail", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  const handleExport = async () => {
    try {
      await adminAPI.exportAuditTrail({ format: "csv" });
      toast({ title: "Success", description: "Export started" });
    } catch (error) {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audit Trail</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAuditTrail}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No audit logs found</TableCell></TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell><Badge>{log.action}</Badge></TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell><Badge variant={log.status === "Success" ? "default" : "destructive"}>{log.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
