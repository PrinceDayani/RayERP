"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Search,
  MessageSquare,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Download,
  Filter
} from "lucide-react";
import { getProjectStats, getAllProjects, updateProject, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { useSocket } from "@/hooks/useSocket";
import tasksAPI, { type Task, type CreateTaskData } from "@/lib/api/tasksAPI";
import employeesAPI, { type Employee } from "@/lib/api/employeesAPI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
}

interface NewTaskForm {
  title: string;
  description: string;
  project: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
}

const ProjectManagementDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueTasks: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);

  const socket = useSocket();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    socket.on('project:created', (project: Project) => {
      setProjects(prev => [project, ...prev]);
      fetchData(); // Refresh stats
      toast({
        title: "New Project Created",
        description: `${project.name} has been created`,
      });
    });

    socket.on('project:updated', (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
      fetchData(); // Refresh stats
      toast({
        title: "Project Updated",
        description: `${updatedProject.name} has been updated`,
      });
    });

    socket.on('project:deleted', (data: { id: string }) => {
      setProjects(prev => prev.filter(p => p._id !== data.id));
      fetchData(); // Refresh stats
      toast({
        title: "Project Deleted",
        description: "Project has been removed",
      });
    });

    socket.on('project:stats', (newStats: ProjectStats) => {
      setStats(newStats);
    });

    socket.on('budget:updated', () => {
      fetchData(); // Refresh when budgets change
    });

    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('project:deleted');
      socket.off('project:stats');
      socket.off('budget:updated');
    };
  }, [socket]);

  const fetchData = async (): Promise<void> => {
    try {
      const [statsData, projectsData] = await Promise.all([
        getProjectStats().catch(() => ({
          totalProjects: 8,
          activeProjects: 5,
          completedProjects: 3,
          overdueTasks: 2,
          totalTasks: 24,
          completedTasks: 18
        })),
        getAllProjects().catch(() => [
          {
            _id: "demo1",
            name: "Website Redesign",
            description: "Complete overhaul of company website with modern design",
            status: "active",
            priority: "high",
            progress: 65,
            startDate: "2024-01-15",
            endDate: "2024-03-15",
            budget: 50000,
            manager: "user1",
            team: ["user1", "user2"],
            createdAt: "2024-01-15T00:00:00Z",
            updatedAt: "2024-01-15T00:00:00Z"
          },
          {
            _id: "demo2",
            name: "Mobile App Development",
            description: "Native mobile application for iOS and Android",
            status: "planning",
            priority: "medium",
            progress: 25,
            startDate: "2024-02-01",
            endDate: "2024-06-01",
            budget: 75000,
            manager: "user1",
            team: ["user1"],
            createdAt: "2024-02-01T00:00:00Z",
            updatedAt: "2024-02-01T00:00:00Z"
          },
          {
            _id: "demo3",
            name: "Database Migration",
            description: "Migrate legacy database to new cloud infrastructure",
            status: "completed",
            priority: "critical",
            progress: 100,
            startDate: "2023-12-01",
            endDate: "2024-01-31",
            budget: 30000,
            manager: "user3",
            team: ["user3"],
            createdAt: "2023-12-01T00:00:00Z",
            updatedAt: "2024-01-31T00:00:00Z"
          }
        ])
      ]);

      if (statsData) {
        setStats(statsData);
      }
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    }
  };

  const handleQuickStatusUpdate = async (projectId: string, newStatus: string): Promise<void> => {
    try {
      await updateProject(projectId, { status: newStatus as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' });
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' } : p));
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access Project Management</p>
            <Button onClick={() => router.push("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Manage projects, tasks, and team collaboration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/projects/analytics")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => router.push("/dashboard/projects/create")}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/projects/analytics")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Projects</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalProjects}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">View analytics →</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Projects</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.activeProjects}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stats.totalProjects > 0 ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(0) : 0}% of total
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Completed</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.completedProjects}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}% success rate
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Overdue Tasks</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.overdueTasks}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {stats.overdueTasks > 0 ? 'Needs attention' : 'All on track'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-700 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="task-management" data-tab="task-management">Task Management</TabsTrigger>
            <TabsTrigger value="project-ledger">Finance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
{/* Quick Actions + Analytics */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/dashboard/projects/create")}>
                  <CardContent className="p-4 text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">New Project</h3>
                    <p className="text-sm text-muted-foreground">Create a new project</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/dashboard/projects/reports")}>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">View Reports</h3>
                    <p className="text-sm text-muted-foreground">Project analytics</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/dashboard/projects/ledger")}>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h3 className="font-medium">Finance</h3>
                    <p className="text-sm text-muted-foreground">Project budgets</p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => (document.querySelector('[data-tab="task-management"]') as HTMLElement)?.click()}>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Manage Tasks</h3>
                    <p className="text-sm text-muted-foreground">Create & track tasks</p>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Project Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Active</span>
                          <span className="font-medium">{stats.activeProjects}</span>
                        </div>
                        <Progress value={(stats.activeProjects / stats.totalProjects) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completed</span>
                          <span className="font-medium">{stats.completedProjects}</span>
                        </div>
                        <Progress value={(stats.completedProjects / stats.totalProjects) * 100} className="h-2" />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate</span>
                          <span className="text-lg font-bold text-green-600">
                            {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Task Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-xl font-bold">{stats.completedTasks}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                          <p className="text-xl font-bold">{stats.overdueTasks}</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Completion Rate</span>
                          <span className="text-lg font-bold text-blue-600">
                            {stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-32 h-32">
                          <circle
                            className="text-gray-200 dark:text-gray-700"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="56"
                            cx="64"
                            cy="64"
                          />
                          <circle
                            className="text-blue-600"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 56}
                            strokeDashoffset={(() => {
                              if (projects.length === 0) return 2 * Math.PI * 56;
                              const totalProgress = projects.reduce((sum: number, p) => sum + (p.progress || 0), 0);
                              const avgProgress = totalProgress / projects.length;
                              const progressRatio = avgProgress / 100;
                              return 2 * Math.PI * 56 * (1 - progressRatio);
                            })()}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="56"
                            cx="64"
                            cy="64"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                          />
                        </svg>
                        <span className="absolute text-3xl font-bold">
                          {projects.length > 0 ? (projects.reduce((sum: number, p) => sum + (p.progress || 0), 0) / projects.length).toFixed(0) : 0}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Across all projects</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Projects</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects/analytics")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No projects yet. Create your first project to get started.
                    </div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                    <div key={project._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{project.name || project.title}</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/projects/${project._id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Select 
                            value={project.status} 
                            onValueChange={(value) => handleQuickStatusUpdate(project._id, value)}
                          >
                            <SelectTrigger className="w-auto h-6 text-xs border-0 bg-transparent p-0">
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="on-hold">On Hold</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge variant="outline" className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <p className="font-medium">{project.progress}%</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="ghost" className="h-6 px-2" 
                                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=finance`); }}>
                            <DollarSign className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=tasks`); }}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
                {projects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No projects found</p>
                    <Button onClick={() => router.push("/dashboard/projects/create")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget & Timeline Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.filter(p => p.budget > 0).length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Budget</p>
                            <p className="text-xl font-bold">
                              ₹{projects.reduce((sum: number, p) => sum + (p.budget || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Spent</p>
                            <p className="text-xl font-bold">
                              ₹{projects.reduce((sum: number, p) => sum + (p.spentBudget || 0), 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Overall Utilization</span>
                            <span className="font-medium">
                              {projects.reduce((sum: number, p) => sum + (p.budget || 0), 0) > 0
                                ? ((projects.reduce((sum: number, p) => sum + (p.spentBudget || 0), 0) / projects.reduce((sum: number, p) => sum + (p.budget || 0), 0)) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={
                              projects.reduce((sum: number, p) => sum + (p.budget || 0), 0) > 0
                                ? (projects.reduce((sum: number, p) => sum + (p.spentBudget || 0), 0) / projects.reduce((sum: number, p) => sum + (p.budget || 0), 0)) * 100
                                : 0
                            } 
                            className="h-3" 
                          />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Remaining</span>
                            <span className="text-lg font-bold text-green-600">
                              ₹{(projects.reduce((sum: number, p) => sum + (p.budget || 0), 0) - projects.reduce((sum: number, p) => sum + (p.spentBudget || 0), 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground">No budget data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projects by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['critical', 'high', 'medium', 'low'].map((priority) => {
                      const count = projects.filter(p => p.priority === priority).length;
                      const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                      const colors = {
                        critical: 'bg-red-500',
                        high: 'bg-orange-500',
                        medium: 'bg-yellow-500',
                        low: 'bg-green-500'
                      };
                      return (
                        <div key={priority}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{priority}</span>
                            <span className="font-medium">{count} projects</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`${colors[priority as keyof typeof colors]} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Projects</CardTitle>
                  <Button onClick={() => router.push("/dashboard/projects/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card key={project._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold cursor-pointer hover:text-blue-600" 
                                onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                              {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Select 
                              value={project.status} 
                              onValueChange={(value) => handleQuickStatusUpdate(project._id, value)}
                            >
                              <SelectTrigger className="w-auto h-6 text-xs border-0 bg-transparent p-0">
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant="outline" className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.team?.length || project.assignedUsers?.length || 0}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1"
                                    onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                              View Project
                            </Button>
                            <Button size="sm" variant="outline"
                                    onClick={() => router.push(`/dashboard/projects/${project._id}?tab=finance`)}>
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetOverview projects={projects} />
          </TabsContent>

          <TabsContent value="tasks">
            <MyTasksContent />
          </TabsContent>

          <TabsContent value="task-management">
            <TaskManagementContent />
          </TabsContent>

          <TabsContent value="project-ledger">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Finance</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects/ledger")}>
                      <FileText className="h-4 w-4 mr-2" />
                      All Reports
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects/ledger?export=true")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Access comprehensive financial reports and analysis for your projects. Each project has its own dedicated finance section with all reports.
                </p>
                
                {/* Finance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Budget</p>
                          <p className="text-2xl font-bold">${projects.reduce((sum: number, p) => sum + (p.budget || 0), 0).toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Projects</p>
                          <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Budget</p>
                          <p className="text-2xl font-bold">${projects.length > 0 ? Math.round(projects.reduce((sum: number, p) => sum + (p.budget || 0), 0) / projects.length).toLocaleString() : 0}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {projects.slice(0, 6).map((project) => (
                    <Card key={project._id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/dashboard/projects/${project._id}?tab=finance`)}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{project.name}</h4>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Budget: ${project.budget?.toLocaleString() || 0}</p>
                            <p className="text-sm text-muted-foreground">Progress: {project.progress}%</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <Button size="sm" variant="outline" className="flex-1 mr-2"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=finance`); }}>
                              View Finance
                            </Button>
                            <Button size="sm" variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=finance&export=true`); }}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button onClick={() => router.push("/dashboard/projects/ledger")}>
                    <FileText className="h-4 w-4 mr-2" />
                    View All Project Finance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Reports</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects/reports?type=summary")}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects/reports?export=pdf")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Report Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=performance")}>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Performance Report</h3>
                      <p className="text-sm text-muted-foreground">Project completion rates</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=budget")}>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">Budget Analysis</h3>
                      <p className="text-sm text-muted-foreground">Financial performance</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=timeline")}>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-medium">Timeline Report</h3>
                      <p className="text-sm text-muted-foreground">Project schedules</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=team")}>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <h3 className="font-medium">Team Performance</h3>
                      <p className="text-sm text-muted-foreground">Resource utilization</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=tasks")}>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <h3 className="font-medium">Task Analytics</h3>
                      <p className="text-sm text-muted-foreground">Task completion stats</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push("/dashboard/projects/reports?type=custom")}>
                    <CardContent className="p-4 text-center">
                      <Filter className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <h3 className="font-medium">Custom Report</h3>
                      <p className="text-sm text-muted-foreground">Build your own report</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-4">
                  <h3 className="text-lg font-medium mb-2">Comprehensive Project Analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    Access detailed reports and analytics for all your projects with real-time data
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => router.push("/dashboard/projects/reports")}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All Reports
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/dashboard/projects/reports?setup=true")}>
                      <Filter className="h-4 w-4 mr-2" />
                      Setup Custom Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

// My Tasks Component
const MyTasksContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const fetchMyTasks = async (): Promise<void> => {
    try {
      const allTasks = await tasksAPI.getAll();
      const myTasks = allTasks.filter((task: Task) => 
        task.assignedTo && 
        (typeof task.assignedTo === 'object' ? task.assignedTo._id === user?._id : task.assignedTo === user?._id)
      );
      setTasks(myTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string): Promise<void> => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus, user?._id);
      await fetchMyTasks();
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Tasks</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">Total: {filteredTasks.length}</Badge>
              <Badge variant="secondary">Completed: {tasksByStatus.completed.length}</Badge>
              <Button size="sm" variant="outline" onClick={() => (document.querySelector('[data-tab="task-management"]') as HTMLElement)?.click()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                    {status.replace('-', ' ')}
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card key={task._id} className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project._id : task.project}?tab=tasks&task=${task._id}`)}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm hover:text-blue-600 transition-colors">{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">Project:</span>
                          <span className="hover:text-blue-600 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project._id : task.project}`); }}>
                            {typeof task.project === 'object' ? task.project.name : 'Unknown Project'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => updateTaskStatus(task._id, value)} defaultValue={task.status}>
                            <SelectTrigger className="h-8 text-xs flex-1" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" className="h-8 px-2"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project._id : task.project}?tab=tasks&task=${task._id}&edit=true`); }}>
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No tasks in this status
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Task Management Component
const TaskManagementContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const socket = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (newTask: Task) => {
      setTasks(prev => [...prev, newTask]);
    });

    socket.on('task:updated', (updatedTask: Task) => {
      setTasks(prev => prev.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      ));
    });

    socket.on('task:deleted', (data: { id: string }) => {
      setTasks(prev => prev.filter(task => task._id !== data.id));
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [socket]);

  const fetchData = async (): Promise<void> => {
    try {
      const [tasksData, projectsData, employeesData] = await Promise.all([
        tasksAPI.getAll(),
        getAllProjects(),
        employeesAPI.getAll()
      ]);
      
      setTasks(tasksData);
      setProjects(projectsData);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setTasks([]);
      setProjects([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!newTask.project || !newTask.assignedTo || !newTask.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const taskData: CreateTaskData = {
        title: newTask.title,
        description: newTask.description,
        project: newTask.project,
        assignedTo: newTask.assignedTo,
        assignedBy: user?._id || '',
        priority: newTask.priority as 'low' | 'medium' | 'high' | 'critical',
        dueDate: newTask.dueDate,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : 0
      };

      const createdTask = await tasksAPI.create(taskData);
      
      if (socket) {
        socket.emit('task:created', createdTask);
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = (): void => {
    setNewTask({
      title: '',
      description: '',
      project: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: ''
    });
  };

  const updateTaskStatus = async (taskId: string, newStatus: string): Promise<void> => {
    try {
      const updatedTask = await tasksAPI.updateStatus(taskId, newStatus, user?._id);
      
      if (socket) {
        socket.emit('task:updated', updatedTask);
      }
      
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Task Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage and track project tasks across all projects</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Project *</Label>
                    <Select onValueChange={(value) => setNewTask(prev => ({ ...prev, project: value }))} value={newTask.project}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedTo">Assign To *</Label>
                    <Select onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))} value={newTask.assignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.length > 0 ? (
                          employees.map((employee) => (
                            <SelectItem key={employee._id} value={employee._id}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-employees" disabled>
                            No employees available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))} value={newTask.priority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estimatedHours">Est. Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        value={newTask.estimatedHours}
                        onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                    {status.replace('-', ' ')}
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task: Task) => (
                    <Card key={task._id} className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project?._id : task.project}?tab=tasks&task=${task._id}`)}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm hover:text-blue-600 transition-colors">{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span className="hover:text-blue-600 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); /* Navigate to user profile */ }}>
                            {typeof task.assignedTo === 'object' 
                              ? `${task.assignedTo?.firstName || 'Unknown'} ${task.assignedTo?.lastName || 'User'}`
                              : 'Unknown User'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">Project:</span>
                          <span className="hover:text-blue-600 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project?._id : task.project}`); }}>
                            {typeof task.project === 'object' ? task.project?.name || 'Unknown Project' : 'Unknown Project'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours || 0}h
                          </div>
                          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                               onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project?._id : task.project}?tab=tasks&task=${task._id}&view=comments`); }}>
                            <MessageSquare className="w-3 h-3" />
                            {task.comments?.length || 0}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Select onValueChange={(value) => updateTaskStatus(task._id, value)} defaultValue={task.status}>
                            <SelectTrigger className="h-8 text-xs flex-1" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" className="h-8 px-2"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project?._id : task.project}?tab=tasks&task=${task._id}&edit=true`); }}>
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No tasks in this status
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Budget Overview Component
const BudgetOverview = ({ projects }: { projects: Project[] }) => {
  const router = useRouter();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, [projects]);

  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('budget:updated', fetchBudgets);
    socket.on('project:updated', fetchBudgets);

    return () => {
      socket.off('budget:updated', fetchBudgets);
      socket.off('project:updated', fetchBudgets);
    };
  }, []);

  const fetchBudgets = async () => {
    try {
      const budgetPromises = projects.map(async (project) => {
        try {
          const token = localStorage.getItem('auth-token');
          if (!token) return null;

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project._id}/budget`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const budget = Array.isArray(data) ? data[0] : data;
            return { project, budget };
          }
          return { project, budget: null };
        } catch {
          return { project, budget: null };
        }
      });

      const results = await Promise.all(budgetPromises);
      setBudgets(results.filter(r => r !== null));
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading budgets...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Budgets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(({ project, budget }) => {
            const totalSpent = budget?.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) || 0;
            const spentPercentage = budget ? (totalSpent / budget.totalBudget) * 100 : 0;
            
            return (
              <Card key={project._id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/dashboard/projects/${project._id}/budget`)}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {budget && (
                        <Badge variant="outline">
                          {budget.currency} {budget.totalBudget?.toLocaleString()}
                        </Badge>
                      )}
                    </div>

                    {budget ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Spent: {budget.currency} {totalSpent.toLocaleString()}</span>
                          <span>{spentPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground">No budget created</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Create Budget
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectManagementDashboard;