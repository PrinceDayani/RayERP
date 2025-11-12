"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Filter } from "lucide-react";
import { GanttChart } from "@/components/GanttChart";
import { getProjectById, type Project } from "@/lib/api/projectsAPI";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

const ProjectTimelinePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        getProjectById(projectId),
        tasksAPI.getTasksByProject(projectId)
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      toast({ title: "Failed to load timeline", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ganttTasks = tasks.map(task => ({
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
            <h1 className="text-3xl font-bold">{project?.name} - Timeline</h1>
            <p className="text-muted-foreground">Gantt chart and timeline visualization</p>
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

      <GanttChart tasks={ganttTasks} title={`${project?.name} Timeline`} />

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Timeline Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTimelinePage;
