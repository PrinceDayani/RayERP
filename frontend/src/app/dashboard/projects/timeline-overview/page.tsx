"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Filter, Calendar, Search, RefreshCw, X, AlertCircle } from "lucide-react";
import { GanttChart } from "@/components/GanttChart";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

type StatusFilter = 'all' | 'active' | 'completed' | 'planning' | 'on-hold';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const TimelineOverviewPage: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, tasksData] = await Promise.all([
        getAllProjects(),
        tasksAPI.getAll()
      ]);
      setProjects(projectsData || []);
      setAllTasks(tasksData || []);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Failed to load timeline data";
      setError(errorMsg);
      toast({ title: errorMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  const filteredTasks = useMemo(() => {
    const projectIds = new Set(filteredProjects.map(p => p._id));
    return allTasks.filter(task => {
      const projectId = typeof task.project === 'string' ? task.project : task.project?._id;
      return projectIds.has(projectId);
    });
  }, [allTasks, filteredProjects]);

  const ganttTasks = useMemo(() => {
    return filteredTasks.map(task => ({
      id: task._id,
      name: task.title,
      startDate: new Date(task.createdAt),
      endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : task.status === 'review' ? 75 : 0,
      status: task.status,
      priority: task.priority,
      assignees: Array.isArray(task.assignedTo) ? task.assignedTo.map((a: any) => typeof a === 'string' ? a : a._id) : []
    }));
  }, [filteredTasks]);

  const stats = useMemo(() => ({
    totalProjects: filteredProjects.length,
    activeProjects: filteredProjects.filter(p => p.status === 'active').length,
    completedProjects: filteredProjects.filter(p => p.status === 'completed').length,
    onHoldProjects: filteredProjects.filter(p => p.status === 'on-hold').length,
    totalTasks: filteredTasks.length,
    completedTasks: filteredTasks.filter(t => t.status === 'completed').length,
    inProgressTasks: filteredTasks.filter(t => t.status === 'in-progress').length,
    pendingTasks: filteredTasks.filter(t => t.status === 'todo').length,
    reviewTasks: filteredTasks.filter(t => t.status === 'review').length
  }), [filteredProjects, filteredTasks]);

  const handleExport = useCallback(() => {
    try {
      const csvData = [
        ['Project Name', 'Status', 'Priority', 'Start Date', 'End Date', 'Progress', 'Tasks'],
        ...filteredProjects.map(p => [
          p.name,
          p.status,
          p.priority,
          new Date(p.startDate).toLocaleDateString(),
          new Date(p.endDate).toLocaleDateString(),
          `${p.progress}%`,
          filteredTasks.filter(t => (typeof t.project === 'string' ? t.project : t.project?._id) === p._id).length
        ])
      ];
      const csv = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-timeline-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Timeline exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export timeline", variant: "destructive" });
    }
  }, [filteredProjects, filteredTasks]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }, []);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Loading timeline data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Failed to Load Timeline</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Projects Timeline</h1>
            <p className="text-muted-foreground">Gantt chart visualization for all projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters {hasActiveFilters && <Badge variant="secondary" className="ml-2">Active</Badge>}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No projects match your filters" : "No projects found"}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <GanttChart tasks={ganttTasks} title="All Projects Timeline" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeProjects} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedTasks} of {stats.totalTasks} tasks
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projects List</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects to display</p>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map(project => {
                    const projectTasks = filteredTasks.filter(t => 
                      (typeof t.project === 'string' ? t.project : t.project?._id) === project._id
                    );
                    return (
                      <div
                        key={project._id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/projects/${project._id}/timeline`)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">{project.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {projectTasks.length} tasks
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {project.progress}% complete
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="capitalize">{project.status}</Badge>
                          <Badge variant="secondary" className="capitalize">{project.priority}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TimelineOverviewPage;
