"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowLeft, GanttChartSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useRouter } from "next/navigation";
import { getAllProjects } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";

const TimelineReportPage = () => {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [viewType, setViewType] = useState("overview");

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData || []);
    } catch (error) {
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTimelineMetrics = () => {
    const now = new Date();
    const total = projects.length;
    const onTime = projects.filter(p => {
      const endDate = new Date(p.endDate);
      return p.status === 'completed' ? true : !isAfter(now, endDate);
    }).length;
    const overdue = projects.filter(p => {
      const endDate = new Date(p.endDate);
      return p.status !== 'completed' && isAfter(now, endDate);
    }).length;
    const upcoming = projects.filter(p => {
      const startDate = new Date(p.startDate);
      return isBefore(now, startDate);
    }).length;
    
    const avgDuration = projects.reduce((sum, p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return sum + differenceInDays(end, start);
    }, 0) / total || 0;

    return {
      total,
      onTime,
      overdue,
      upcoming,
      avgDuration,
      onTimeRate: (onTime / total) * 100 || 0
    };
  };

  const getTimelineData = () => {
    const monthlyData = {};
    
    projects.forEach(project => {
      const startMonth = format(new Date(project.startDate), 'MMM yyyy');
      const endMonth = format(new Date(project.endDate), 'MMM yyyy');
      
      if (!monthlyData[startMonth]) {
        monthlyData[startMonth] = { month: startMonth, started: 0, completed: 0 };
      }
      if (!monthlyData[endMonth]) {
        monthlyData[endMonth] = { month: endMonth, started: 0, completed: 0 };
      }
      
      monthlyData[startMonth].started++;
      if (project.status === 'completed') {
        monthlyData[endMonth].completed++;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  };

  const getDurationData = () => {
    const ranges = [
      { range: '< 1 month', min: 0, max: 30 },
      { range: '1-3 months', min: 31, max: 90 },
      { range: '3-6 months', min: 91, max: 180 },
      { range: '6+ months', min: 181, max: Infinity }
    ];
    
    return ranges.map(({ range, min, max }) => ({
      range,
      count: projects.filter(p => {
        const duration = differenceInDays(new Date(p.endDate), new Date(p.startDate));
        return duration >= min && duration <= max;
      }).length
    }));
  };

  const getProjectTimeline = () => {
    return projects.map(project => {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const now = new Date();
      const duration = differenceInDays(end, start);
      const elapsed = differenceInDays(now, start);
      const remaining = differenceInDays(end, now);
      
      return {
        ...project,
        duration,
        elapsed: Math.max(0, elapsed),
        remaining: Math.max(0, remaining),
        isOverdue: project.status !== 'completed' && isAfter(now, end),
        daysOverdue: project.status !== 'completed' && isAfter(now, end) ? differenceInDays(now, end) : 0
      };
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const metrics = getTimelineMetrics();
  const timelineData = getTimelineData();
  const durationData = getDurationData();
  const projectTimeline = getProjectTimeline();

  if (loading) {
    return <div className="flex justify-center p-8">Loading timeline data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              Timeline Report
            </h1>
            <p className="text-muted-foreground">Project schedules and timeline analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="gantt">Gantt View</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Timeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{metrics.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Time</p>
                <p className="text-3xl font-bold">{metrics.onTime}</p>
                <p className="text-xs text-green-600">{metrics.onTimeRate.toFixed(1)}% on-time rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold">{metrics.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-3xl font-bold">{Math.round(metrics.avgDuration)}</p>
                <p className="text-xs text-orange-600">days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="started" stroke="#8884d8" name="Started" />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Duration Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Timeline Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Project Name</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Start Date</th>
                  <th className="text-left p-2">End Date</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Progress</th>
                  <th className="text-left p-2">Timeline Status</th>
                </tr>
              </thead>
              <tbody>
                {projectTimeline.map((project) => (
                  <tr key={project._id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{project.name}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm">{format(new Date(project.startDate), 'MMM dd, yyyy')}</td>
                    <td className="p-2 text-sm">{format(new Date(project.endDate), 'MMM dd, yyyy')}</td>
                    <td className="p-2 text-sm">{project.duration} days</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.isOverdue ? 'bg-red-100 text-red-700' :
                        project.remaining <= 7 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.isOverdue ? `${project.daysOverdue} days overdue` :
                         project.status === 'completed' ? 'Completed' :
                         project.remaining <= 7 ? `${project.remaining} days left` :
                         'On Track'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart View */}
      {viewType === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectTimeline.slice(0, 10).map((project) => (
                <div key={project._id} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium truncate">{project.name}</div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className={`h-6 rounded-full flex items-center justify-center text-xs text-white ${
                          project.isOverdue ? 'bg-red-500' :
                          project.status === 'completed' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(project.progress, 100)}%` }}
                      >
                        {project.progress}%
                      </div>
                      <div className="absolute top-0 right-0 text-xs text-gray-600 mt-1">
                        {format(new Date(project.endDate), 'MMM dd')}
                      </div>
                    </div>
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

export default TimelineReportPage;