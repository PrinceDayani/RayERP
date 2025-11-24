//path: frontend/src/components/projects/TaskManagement.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { getProjectReports, getTaskReports, getTeamProductivity } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";

interface ProjectReportData {
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalBudget: number;
    spentBudget: number;
  }>;
  progress: {
    avgProgress: number;
    totalProjects: number;
    completedProjects: number;
  };
}

interface TaskReportData {
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalEstimated: number;
    totalActual: number;
  }>;
  priorityBreakdown: Array<{
    priority: string;
    count: number;
  }>;
  overdueTasks: number;
}

interface TeamProductivityData {
  employeeId: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  efficiency: number;
}

const ProjectReports: React.FC = () => {
  const [projectReports, setProjectReports] = useState<ProjectReportData | null>(null);
  const [taskReports, setTaskReports] = useState<TaskReportData | null>(null);
  const [teamProductivity, setTeamProductivity] = useState<TeamProductivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();

      const [projectData, taskData, productivityData] = await Promise.all([
        getProjectReports(fromDate, toDate),
        getTaskReports(fromDate, toDate),
        getTeamProductivity(fromDate, toDate)
      ]);

      setProjectReports(projectData.data);
      setTaskReports(taskData.data);
      setTeamProductivity(productivityData.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      // This would implement actual export functionality
      toast({
        title: "Export Started",
        description: `Exporting ${reportType} report...`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Reports</h2>
          <p className="text-muted-foreground">Analytics and insights for project management</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => handleExportReport('project-summary')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projectReports?.progress.totalProjects || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{projectReports?.progress.completedProjects || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{Math.round(projectReports?.progress.avgProgress || 0)}%</p>
              </div>
              <PieChart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                <p className="text-2xl font-bold">{taskReports?.overdueTasks || 0}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectReports?.statusBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={taskReports?.priorityBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, count }) => `${priority}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(taskReports?.priorityBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskReports?.statusBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Productivity */}
      <Card>
        <CardHeader>
          <CardTitle>Team Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamProductivity.map((member) => (
              <div key={member.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.completedTasks}/{member.totalTasks} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{Math.round(member.completionRate)}% completion</p>
                  <p className="text-sm text-muted-foreground">{Math.round(member.efficiency)}% efficiency</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      {projectReports?.statusBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectReports.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{status.status} Projects</h4>
                    <p className="text-sm text-muted-foreground">{status.count} projects</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${status.totalBudget.toLocaleString()} allocated</p>
                    <p className="text-sm text-muted-foreground">${status.spentBudget.toLocaleString()} spent</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectReports;
