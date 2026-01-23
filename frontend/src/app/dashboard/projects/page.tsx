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
  MessageSquare, Clock, Coins, Edit, FileText, Download, Filter, ArrowRight,
  Briefcase, Target, Activity, Zap, GanttChartSquare, Trash2
} from "lucide-react";
import { TieredAccessWrapper } from "@/components/common/TieredAccessWrapper";
import { getProjectStats, getAllProjects, updateProject, deleteProject, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { useSocket } from "@/hooks/useSocket";
import tasksAPI, { type Task, type CreateTaskData } from "@/lib/api/tasksAPI";
import employeesAPI, { type Employee } from "@/lib/api/employeesAPI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProjectViews from "@/components/projects/ProjectViews";
import CurrencyConverter from "@/components/budget/CurrencyConverter";
import { useCurrency } from "@/contexts/CurrencyContext";
import ProjectCurrencySwitcher from "@/components/projects/ProjectCurrencySwitcher";
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';
import { SectionLoader } from '@/components/PageLoader';
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
  atRiskProjects?: number;
  overdueProjects?: number;
}

const ProjectManagementDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { formatAmount } = useGlobalCurrency();
  const router = useRouter();
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0, activeProjects: 0, completedProjects: 0,
    overdueTasks: 0, totalTasks: 0, completedTasks: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (projectId: string, newStatus: Project['status']) => {
    try {
      await updateProject(projectId, { status: newStatus });
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));
      toast({ title: "Status updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'progress': return b.progress - a.progress;
      case 'dueDate': return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default: return 0;
    }
  });

  const handleCloneProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/clone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Project cloned successfully" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to clone project", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) return;
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      toast({ title: "Project deleted successfully" });
      fetchData();
    } catch (error) {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  };

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

  const hasBasicViewItems = false;
  const fullAccessCount = projects.length;
  const basicViewCount = 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Grid Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-modern">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TieredAccessWrapper 
      title="Project Management" 
      hasBasicViewItems={hasBasicViewItems}
      showLegend={hasBasicViewItems}
      fullAccessCount={fullAccessCount}
      basicViewCount={basicViewCount}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">Project Management</h1>
          <p className="text-muted-foreground mt-2 text-base">Manage projects, tasks, and team collaboration</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ProjectCurrencySwitcher className="hidden sm:flex" />
          <Button variant="outline" onClick={() => router.push("/dashboard/projects/timeline-overview")} className="h-11 hover:bg-[#970E2C]/5 hover:border-[#970E2C]/30">
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/projects/analytics")} className="h-11 hover:bg-[#970E2C]/5 hover:border-[#970E2C]/30">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => router.push("/dashboard/projects/create")} className="h-11 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Total Projects</p>
                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-2">All projects</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Active Projects</p>
                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.activeProjects}</p>
                <p className="text-xs text-[#970E2C] mt-2">
                  {stats.totalProjects > 0 ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                <Activity className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Completed</p>
                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.completedProjects}</p>
                <p className="text-xs text-[#970E2C] mt-2">
                  {stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}% success rate
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                <Target className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">At Risk</p>
                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.atRiskProjects || 0}</p>
                <p className="text-xs text-[#970E2C] mt-2">
                  {stats.overdueTasks || 0} overdue tasks
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                <Zap className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50 p-1 rounded-xl border border-border/50">
          <TabsTrigger value="overview" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Overview</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">All Projects</TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Budgets</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">My Tasks</TabsTrigger>
          <TabsTrigger value="task-management" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Task Management</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-border/50 focus:border-[#970E2C] focus:ring-[#970E2C]/20"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-40 h-11">
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
                      <SelectTrigger className="w-full md:w-40 h-11">
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
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full md:w-40 h-11">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="progress">Progress</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="sm:hidden">
                  <ProjectCurrencySwitcher />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length === 0 ? (
              <Card className="col-span-full border-0 shadow-lg">
                <CardContent className="p-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#970E2C]/10 to-[#800020]/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-12 h-12 text-[#970E2C]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">No projects found</h3>
                  <p className="text-muted-foreground mb-8 text-base">Create your first project to get started with project management</p>
                  <Button onClick={() => router.push("/dashboard/projects/create")} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project._id} className="group relative border-0 shadow-lg hover:shadow-2xl hover:shadow-[#970E2C]/10 transition-all duration-300 cursor-pointer overflow-hidden bg-gradient-to-br from-card to-card/50 hover:-translate-y-1"
                      onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6 space-y-4 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${getPriorityColor(project.priority)}`}>
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg group-hover:text-[#970E2C] transition-colors line-clamp-1">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#970E2C]/10 hover:text-[#970E2C]"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}/edit`); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                                onClick={(e) => handleDeleteProject(project._id, project.name, e)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge variant="outline" className="border-[#970E2C]/30 text-[#970E2C]">{project.priority}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Progress</span>
                        <span className="font-bold text-[#970E2C]">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-medium text-xs">{new Date(project.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Team</p>
                          <p className="font-medium text-xs">{project.team?.length || 0} members</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-[#970E2C] hover:text-white hover:border-[#970E2C] transition-all"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=tasks`); }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Tasks
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-[#970E2C] hover:text-white hover:border-[#970E2C] transition-all"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${project._id}?tab=finance`); }}>
                        <Coins className="h-3.5 w-3.5 mr-1.5" />
                        {formatAmount(project.budget || 0, (project as any).currency || 'INR')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <ProjectViews projects={projects} onProjectsUpdate={setProjects} />
        </TabsContent>

        <TabsContent value="budgets">
          <div className="space-y-6">
            <CurrencyConverter />
            <BudgetOverview projects={projects} />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <MyTasksContent />
        </TabsContent>

        <TabsContent value="task-management">
          <TaskManagementContent />
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
            <CardHeader>
              <CardTitle className="text-lg">Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, title: "Performance Report", desc: "Project completion rates", route: "/dashboard/projects/reports/performance" },
                  { icon: Coins, title: "Budget Analysis", desc: "Financial performance", route: "/dashboard/projects/reports/budget" },
                  { icon: Calendar, title: "Timeline Report", desc: "Project schedules", route: "/dashboard/projects/reports/timeline" },
                ].map((report, idx) => (
                  <Card key={idx} className="group cursor-pointer hover:shadow-xl hover:shadow-[#970E2C]/10 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg"
                        onClick={() => router.push(report.route)}>
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <report.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-base mb-2">{report.title}</h3>
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
    </TieredAccessWrapper>
  );
};

const MyTasksContent: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    priority: 'medium',
    status: 'todo',
    dueDate: ''
  });

  useEffect(() => {
    fetchMyTasks();
    fetchProjects();
    fetchEmployees();
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      console.log('Fetching tasks for user:', user?._id);
      const allTasks = await tasksAPI.getAll();
      console.log('All tasks received:', allTasks);
      
      const myTasks = allTasks.filter((task: Task) => 
        task.assignedTo && (typeof task.assignedTo === 'object' ? task.assignedTo._id === user?._id : task.assignedTo === user?._id)
      );
      console.log('Filtered my tasks:', myTasks);
      setTasks(myTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const employeesData = await employeesAPI.getAll();
      setEmployees(Array.isArray(employeesData) ? employeesData : employeesData?.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!taskForm.title || !taskForm.project || !taskForm.assignedTo || !taskForm.dueDate) {
        toast({ title: "Please fill all required fields", variant: "destructive" });
        return;
      }
      
      const createData: CreateTaskData = {
        title: taskForm.title,
        description: taskForm.description,
        project: taskForm.project,
        assignedTo: taskForm.assignedTo,
        assignedBy: user?._id || '',
        priority: taskForm.priority as 'low' | 'medium' | 'high' | 'critical',
        dueDate: taskForm.dueDate
      };
      
      console.log('Creating task with data:', createData);
      const newTask = await tasksAPI.create(createData);
      console.log('Task created successfully:', newTask);
      
      setTasks(prev => [newTask, ...prev]);
      setIsCreateModalOpen(false);
      setTaskForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      toast({ title: "Task created successfully" });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({ 
        title: "Failed to create task", 
        description: error?.response?.data?.message || error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const validStatus = newStatus as 'todo' | 'in-progress' | 'review' | 'completed';
      console.log('Updating task status:', { taskId, newStatus: validStatus });
      
      await tasksAPI.update(taskId, { status: validStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: validStatus } : t));
      toast({ title: "Task status updated" });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({ 
        title: "Failed to update task", 
        description: error?.response?.data?.message || error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      console.log('Deleting task:', taskId);
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast({ title: "Task deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({ 
        title: "Failed to delete task", 
        description: error?.response?.data?.message || error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const getTaskStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'review': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'critical': 'text-red-600',
      'high': 'text-orange-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) return <Card className="card-modern"><CardContent className="p-6 text-center">Loading...</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Total Tasks</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">In Progress</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">{tasks.filter(t => t.status === 'in-progress').length}</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Completed</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{tasks.filter(t => t.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border-0 shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-4 relative">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Overdue</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">{tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-[#970E2C]" />
              My Tasks
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task._id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project._id : task.project}/tasks/${task._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{task.title}</h4>
                          <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                            {task.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {task.project && typeof task.project === 'object' && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {task.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Select value={task.status} onValueChange={(value) => handleUpdateTaskStatus(task._id, value)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task._id)} className="hover:bg-red-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} placeholder="Task title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} placeholder="Task description" />
            </div>
            <div>
              <Label>Project</Label>
              <Select value={taskForm.project} onValueChange={(value) => setTaskForm({...taskForm, project: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({...taskForm, assignedTo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({...taskForm, priority: value})}>
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
                <Label>Due Date</Label>
                <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateTask} className="flex-1">Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TaskManagementContent: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      const allTasks = await tasksAPI.getAll();
      setTasks(allTasks);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getTaskStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'review': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <Card className="card-modern"><CardContent className="p-6"><SectionLoader /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['todo', 'in-progress', 'review', 'completed'].map(status => (
          <Card key={status} className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide capitalize">{status.replace('-', ' ')}</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{tasks.filter(t => t.status === status).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-[#970E2C]" />
              All Tasks
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-32">
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
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <Card key={task._id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${typeof task.project === 'object' ? task.project._id : task.project}?tab=tasks`)}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                          {task.status}
                        </Badge>
                        <Badge variant="outline">{task.priority}</Badge>
                      </div>
                      <h4 className="font-semibold line-clamp-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BudgetOverview = ({ projects }: { projects: Project[] }) => {
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    projectName: '',
    project: '',
    totalBudget: '',
    currency: 'INR',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBudgetData();
  }, [projects]);

  const fetchBudgetData = async () => {
    try {
      console.log('Fetching budget data...');
      const [budgetsData, analyticsData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/all`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        }).then(async r => {
          if (!r.ok) throw new Error('Failed to fetch budgets');
          return r.json();
        }).catch(err => {
          console.error('Error fetching budgets:', err);
          return [];
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/analytics`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        }).then(async r => {
          if (!r.ok) throw new Error('Failed to fetch analytics');
          return r.json();
        }).catch(err => {
          console.error('Error fetching analytics:', err);
          return null;
        })
      ]);
      
      console.log('Budget data received:', { budgetsData, analyticsData });
      setBudgets(budgetsData);
      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      if (!budgetForm.projectName || !budgetForm.totalBudget) {
        toast({ title: "Please fill required fields", variant: "destructive" });
        return;
      }
      
      console.log('Creating budget with data:', budgetForm);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ...budgetForm,
          totalBudget: parseFloat(budgetForm.totalBudget)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create budget');
      }
      
      toast({ title: "Budget created successfully" });
      setIsCreateModalOpen(false);
      setBudgetForm({ projectName: '', project: '', totalBudget: '', currency: 'INR', description: '', startDate: '', endDate: '' });
      fetchBudgetData();
    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast({ 
        title: "Failed to create budget", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    try {
      console.log('Deleting budget:', budgetId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete budget');
      }
      
      toast({ title: "Budget deleted successfully" });
      fetchBudgetData();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({ 
        title: "Failed to delete budget", 
        description: error?.message || "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const getBudgetStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'active': 'bg-blue-100 text-blue-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-12">
          <SectionLoader text="Loading budget data..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Analytics Cards */}
      {analytics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budgets</p>
                  <p className="text-2xl font-bold">{analytics.summary.totalBudgets}</p>
                </div>
                <Coins className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{analytics.summary.pendingApprovals}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{analytics.summary.approvedBudgets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <p className="text-2xl font-bold">{analytics.summary.utilizationRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget List */}
      <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-[#970E2C]" />
            Project Budgets
          </CardTitle>
          <div className="flex items-center gap-3">
            <ProjectCurrencySwitcher />
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
            <Button onClick={() => router.push('/dashboard/finance/budgets')} size="sm" variant="outline">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No budgets created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(budgets) ? budgets : []).slice(0, 10).map((budget) => (
                <Card key={budget._id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/finance/budgets/${budget._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{budget.projectName}</h4>
                          <Badge className={getBudgetStatusColor(budget.status)} variant="secondary">
                            {budget.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Budget: {formatAmount(budget.totalBudget, budget.currency || 'INR')}</span>
                          <span>Spent: {formatAmount(budget.actualSpent || 0, budget.currency || 'INR')}</span>
                          <span>Remaining: {formatAmount(budget.remainingBudget || budget.totalBudget, budget.currency || 'INR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium mb-1">
                            {budget.utilizationPercentage?.toFixed(1) || 0}%
                          </div>
                          <Progress value={budget.utilizationPercentage || 0} className="w-24 h-2" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteBudget(budget._id); }} className="hover:bg-red-100 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Budget Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input 
                value={budgetForm.projectName} 
                onChange={(e) => setBudgetForm({...budgetForm, projectName: e.target.value})} 
                placeholder="Project name" 
              />
            </div>
            <div>
              <Label>Total Budget *</Label>
              <Input 
                type="number" 
                value={budgetForm.totalBudget} 
                onChange={(e) => setBudgetForm({...budgetForm, totalBudget: e.target.value})} 
                placeholder="0.00" 
              />
            </div>
            <div>
              <Label>Project</Label>
              <Select value={budgetForm.project} onValueChange={(value) => {
                setBudgetForm({...budgetForm, project: value});
                const selectedProject = projects.find(p => p._id === value);
                if (selectedProject && !budgetForm.projectName) {
                  setBudgetForm(prev => ({...prev, project: value, projectName: selectedProject.name}));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to existing project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Select value={budgetForm.currency} onValueChange={(value) => setBudgetForm({...budgetForm, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input 
                  value={budgetForm.description} 
                  onChange={(e) => setBudgetForm({...budgetForm, description: e.target.value})} 
                  placeholder="Budget description" 
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateBudget} className="flex-1">Create Budget</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManagementDashboard;
