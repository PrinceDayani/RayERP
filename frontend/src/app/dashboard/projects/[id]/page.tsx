//path: frontend/src/app/dashboard/projects/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TaskManagement from "@/components/projects/TaskManagement";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectFiles from "@/components/projects/ProjectFiles";
import ProjectActivity from "@/components/projects/ProjectActivity";
import ProjectAnalytics from "@/components/ProjectAnalytics";
import ProjectProfitLoss from "@/components/projects/finance/ProjectProfitLoss";
import ProjectTrialBalance from "@/components/projects/finance/ProjectTrialBalance";
import ProjectBalanceSheet from "@/components/projects/finance/ProjectBalanceSheet";
import ProjectCashFlow from "@/components/projects/finance/ProjectCashFlow";
import ProjectLedger from "@/components/projects/finance/ProjectLedger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3,
  Edit,
  Settings
} from "lucide-react";
import { getProjectById, updateProject, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { GanttChart } from "@/components/GanttChart";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";


const ProjectDetailPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);


  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchBudget();
      fetchTasks();
    }
  }, [isAuthenticated, projectId]);

  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('project:updated', (updatedProject: Project) => {
      if (updatedProject._id === projectId) {
        setProject(updatedProject);
      }
    });

    socket.on('budget:updated', (data: any) => {
      if (data.projectId === projectId) {
        fetchBudget();
      }
    });

    return () => {
      socket.off('project:updated');
      socket.off('budget:updated');
    };
  }, [projectId]);

  const fetchBudget = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      console.log('Fetching budget for project:', projectId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Budget response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Budget data:', data);
        const budgetData = Array.isArray(data) ? data[0] : data;
        setBudget(budgetData || null);
      } else {
        console.error('Failed to fetch budget, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getTasksByProject(projectId);
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
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
              <p className="text-muted-foreground mb-4">Please log in to access Project Details</p>
              <Button onClick={() => router.push("/login")}>Login</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="flex justify-center p-8">Loading project details...</div>
    );
  }

  if (!project) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/projects")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${projectId}/analytics`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Status</p>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    {project.status === 'active' ? 'In Progress' : project.status === 'completed' ? 'Finished' : 'Pending'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Progress</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{project.progress}%</p>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Budget</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {budget ? `${budget.currency} ${budget.totalBudget?.toLocaleString()}` : '₹0'}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {budget ? `${budget.currency} ${budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0).toLocaleString()} spent` : '₹0 spent'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Team Size</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{project.team?.length || 0}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">active members</p>
                </div>
                <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days Elapsed</span>
                  <span className="font-medium">
                    {Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <Progress 
                  value={Math.min((Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) / Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100, 100)} 
                  className="h-2 mt-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            </CardHeader>
            <CardContent>
              {budget ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-medium">
                      {budget.totalBudget > 0 ? ((budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) / budget.totalBudget) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={budget.totalBudget > 0 ? (budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) / budget.totalBudget) * 100 : 0} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-green-600">
                      {budget.currency} {(budget.totalBudget - budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No budget set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="font-medium">
                    {(() => {
                      const timeProgress = Math.min((Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) / Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100, 100);
                      return timeProgress > 0 ? ((project.progress / timeProgress) * 100).toFixed(0) : 0;
                    })()}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={project.progress >= Math.min((Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) / Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100, 100) ? "default" : "destructive"}>
                    {project.progress >= Math.min((Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) / Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100, 100) ? "On Track" : "At Risk"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Start Date</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">End Date</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>

                {project.client && (
                  <div>
                    <h4 className="font-medium mb-2">Client</h4>
                    <p className="text-muted-foreground">{project.client}</p>
                  </div>
                )}

                {project.tags && project.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Project Manager</p>
                      <p className="text-sm text-muted-foreground">Manager</p>
                    </div>
                  </div>
                  
                  {project.team && project.team.length > 0 ? (
                    project.team.map((memberId, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Team Member {index + 1}</p>
                          <p className="text-sm text-muted-foreground">Developer</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No team members assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for Tasks and Other Details */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskManagement projectId={projectId} showProjectTasks={true} />
          </TabsContent>

          <TabsContent value="analytics">
            <ProjectAnalytics projectId={projectId} />
          </TabsContent>

          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Budget</CardTitle>
                  <Button onClick={() => router.push(`/dashboard/projects/${projectId}/budget`)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {budget ? 'Manage Budget' : 'Create Budget'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budget ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Total Budget</p>
                            <p className="text-2xl font-bold">{budget.currency} {budget.totalBudget?.toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <BarChart3 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold">{budget.currency} {budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0).toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <Users className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-2xl font-bold">{budget.currency} {(budget.totalBudget - budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0)).toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Budget Utilization</span>
                        <span>{((budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) / budget.totalBudget) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min((budget.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) / budget.totalBudget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Budget Categories</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {budget.categories?.map((category: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="font-medium capitalize">{category.name}</h5>
                                <Badge variant="outline" className="capitalize">{category.type}</Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Allocated:</span>
                                  <span>{budget.currency} {category.allocatedAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Spent:</span>
                                  <span>{budget.currency} {category.spentAmount?.toLocaleString()}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Budget Created</h3>
                    <p className="text-muted-foreground mb-4">This project doesn't have a budget yet. Create one to start tracking expenses.</p>
                    <Button onClick={() => router.push(`/dashboard/projects/${projectId}/budget`)}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Create Budget
                    </Button>
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Button onClick={() => router.push(`/dashboard/projects/${projectId}/budget`)} className="w-full" variant="outline">
                    View Full Budget Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            {tasks.length > 0 && (
              <GanttChart 
                tasks={tasks.map(task => ({
                  id: task._id,
                  name: task.title,
                  startDate: new Date(task.createdAt),
                  endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
                  status: task.status,
                  priority: task.priority
                }))}
                title={`${project?.name} Timeline`}
              />
            )}
            <div className="mt-6">
              <ProjectTimeline projectId={projectId} />
            </div>
          </TabsContent>

          <TabsContent value="files">
            <ProjectFiles projectId={projectId} />
          </TabsContent>

          <TabsContent value="finance">
            <Tabs defaultValue="profit-loss" className="space-y-4">
              <TabsList>
                <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
                <TabsTrigger value="ledger">Ledger & Journal</TabsTrigger>
              </TabsList>

              <TabsContent value="profit-loss">
                <ProjectProfitLoss projectId={projectId} />
              </TabsContent>

              <TabsContent value="trial-balance">
                <ProjectTrialBalance projectId={projectId} />
              </TabsContent>

              <TabsContent value="balance-sheet">
                <ProjectBalanceSheet projectId={projectId} />
              </TabsContent>

              <TabsContent value="cash-flow">
                <ProjectCashFlow projectId={projectId} />
              </TabsContent>

              <TabsContent value="ledger">
                <ProjectLedger projectId={projectId} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="activity">
            <ProjectActivity projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default ProjectDetailPage;