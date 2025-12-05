"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

export default function DataExportTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [module, setModule] = useState("employees");
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await adminAPI.getExportJobs();
      setJobs(response.data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch jobs", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleExport = async () => {
    setLoading(true);
    try {
      await adminAPI.exportData(module, format, {});
      toast({ title: "Success", description: "Export job created" });
      fetchJobs();
    } catch (error) {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employees">Employees</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Exporting..." : "Export"}
          </Button>

          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Export Jobs</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center">No export jobs</TableCell></TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.jobId}>
                    <TableCell>{job.module}</TableCell>
                    <TableCell>{job.format.toUpperCase()}</TableCell>
                    <TableCell><Badge variant={job.status === "completed" ? "default" : "secondary"}>{job.status}</Badge></TableCell>
                    <TableCell>{job.progress}%</TableCell>
                    <TableCell className="text-sm">{new Date(job.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
