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
  Plus, Calendar, Users, BarChart3, CheckCircle, AlertCircle, TrendingUp, Search,
  MessageSquare, Clock, DollarSign, Edit, FileText, Download, Filter, ArrowRight,
  Briefcase, Target, Activity, Zap, GanttChartSquare
} from "lucide-react";
import { getProjectStats, getAllProjects, updateProject, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { useSocket } from "@/hooks/useSocket";
import tasksAPI, { type Task, type CreateTaskData } from "@/lib/api/tasksAPI";
import employeesAPI, { type Employee } from "@/lib/api/employeesAPI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GanttChart } from "@/components/GanttChart";

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
}

const ProjectManagementDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0, activeProjects: 0, completedProjects: 0,
    overdueTasks: 0, totalTasks: 0, completedTasks: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const socket = useSocket();

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('project:created', (project: Project) => {
      setProjects(prev => [project, ...prev]);
      fetchData();
    });
    socket.on('project:updated', (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
      fetchData();
    });
    socket.on('project:deleted', (data: { id: string }) => {
      setProjects(prev => prev.filter(p => p._id !== data.id));
      fetchData();
    });
    return () => {
      socket.off('project:created');
      socket.off('project:updated');
      socket.off('project:deleted');
    };
  }, [socket]);

  const fetchData = async (): Promise<void> => {
    try {
      const [statsData, projectsData, tasksData] = await Promise.all([
        getProjectStats().catch(() => ({
          totalProjects: 8, activeProjects: 5, completedProjects: 3,
          overdueTasks: 2, totalTasks: 24, completedTasks: 18
        })),
        getAllProjects().catch(() => []),
        tasksAPI.getAll().catch(() => [])
      ]);
      if (statsData) setStats(statsData);
      setProjects(projectsData || []);
      setAllTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string): string => {
    const colors = {
      'active': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
      'completed': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
      'on-hold': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
      'cancelled': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
      'planning': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      'critical': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const handleQuickStatusUpdate = async (projectId: string, newStatus: string) => {
    try {
      await updateProject(projectId, { status: newStatus });
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));
      toast({ title: "Status updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="card-modern max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to access Project Management</p>
            <Button onClick={() => router.push("/login")} className="btn-primary-gradient w-full">Login to Continue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage projects, tasks, and team collaboration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard/projects/timeline-overview")}>
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/projects/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => router.push("/dashboard/projects/create")} className="btn-primary-gradient">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">All projects</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold text-foreground">{stats.activeProjects}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stats.totalProjects > 0 ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground">{stats.completedProjects}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}% success rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                <p className="text-3xl font-bold text-foreground">{stats.overdueTasks}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {stats.overdueTasks > 0 ? 'Needs attention' : 'All on track'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All Projects</TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Budgets</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">My Tasks</TabsTrigger>
          <TabsTrigger value="task-management" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Task Management</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Gantt Chart */}
          {allTasks.length > 0 && (
            <GanttChart 
              tasks={allTasks.map(task => ({
                id: task._id,
                name: task.title,
                startDate: new Date(task.createdAt),
                endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
                status: task.status,
                priority: task.priority
              }))}
              title="Projects Timeline Overview"
            />
          )}

          {/* Search and Filters */}
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Priority" />
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
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length === 0 ? (
              <Card className="col-span-full card-modern">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                  <p className="text-muted-foreground mb-6">Create your first project to get started</p>
                  <Button onClick={() => router.push("/dashboard/projects/create")} className="btn-primary-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project._id} className="card-modern hover-lift cursor-pointer group"
                      onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}/edit`); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {project.status}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.team?.length || 0} members</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=tasks`); }}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Tasks
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}/timeline`); }}>
                        <GanttChartSquare className="h-3 w-3 mr-1" />
                        Timeline
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=finance`); }}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        Budget
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                All Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project._id} className="card-modern hover-lift cursor-pointer group"
                        onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground line-clamp-1">{project.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(project.status)} variant="secondary">{project.status}</Badge>
                        <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
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

        <TabsContent value="reports">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, title: "Performance Report", desc: "Project completion rates", color: "text-green-600" },
                  { icon: DollarSign, title: "Budget Analysis", desc: "Financial performance", color: "text-blue-600" },
                  { icon: Calendar, title: "Timeline Report", desc: "Project schedules", color: "text-purple-600" },
                ].map((report, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <report.icon className={`h-8 w-8 mx-auto mb-2 ${report.color}`} />
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MyTasksContent: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      const allTasks = await tasksAPI.getAll();
      const myTasks = allTasks.filter((task: Task) => 
        task.assignedTo && (typeof task.assignedTo === 'object' ? task.assignedTo._id === user?._id : task.assignedTo === user?._id)
      );
      setTasks(myTasks);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Card className="card-modern"><CardContent className="p-6 text-center">Loading...</CardContent></Card>;

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Your assigned tasks will appear here</p>
      </CardContent>
    </Card>
  );
};

const TaskManagementContent: React.FC = () => {
  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>Task Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Manage all project tasks</p>
      </CardContent>
    </Card>
  );
};

const BudgetOverview = ({ projects }: { projects: Project[] }) => {
  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>Project Budgets</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Budget overview for all projects</p>
      </CardContent>
    </Card>
  );
};

export default ProjectManagementDashboard;
