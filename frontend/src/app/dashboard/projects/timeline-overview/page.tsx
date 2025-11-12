"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Filter, Calendar } from "lucide-react";
import { GanttChart } from "@/components/GanttChart";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

const TimelineOverviewPage: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData] = await Promise.all([
        getAllProjects(),
        tasksAPI.getAll()
      ]);
      setProjects(projectsData);
      setAllTasks(tasksData);
    } catch (error) {
      toast({ title: "Failed to load timeline", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ganttTasks = allTasks.map(task => ({
    id: task._id,
    name: task.title,
    startDate: new Date(task.createdAt),
    endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
    status: task.status,
    priority: task.priority,
    assignees: task.assignedTo
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Projects Timeline</h1>
            <p className="text-muted-foreground">Gantt chart visualization for all projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <GanttChart tasks={ganttTasks} title="All Projects Timeline" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Project Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Projects</span>
                <Badge variant="secondary">{projects.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Projects</span>
                <Badge className="bg-green-100 text-green-700">
                  {projects.filter(p => p.status === 'active').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed Projects</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {projects.filter(p => p.status === 'completed').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Task Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Tasks</span>
                <Badge variant="secondary">{allTasks.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed Tasks</span>
                <Badge className="bg-green-100 text-green-700">
                  {allTasks.filter(t => t.status === 'completed').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">In Progress</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {allTasks.filter(t => t.status === 'in-progress').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {allTasks.filter(t => t.status === 'pending').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map(project => (
              <div
                key={project._id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/projects/${project._id}/timeline`)}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{project.status}</Badge>
                  <Button variant="ghost" size="sm">View Timeline</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineOverviewPage;
