"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, TrendingUp, DollarSign, Users, Calendar, CheckCircle, 
  AlertCircle, Clock, BarChart3, Activity, Target, Zap
} from "lucide-react";
import { getProjectById } from "@/lib/api/projectsAPI";
import tasksAPI from "@/lib/api/tasksAPI";

const ProjectAnalytics = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchData();
    }
  }, [isAuthenticated, projectId]);

  const fetchData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        getProjectById(projectId),
        tasksAPI.getAll()
      ]);
      
      setProject(projectData);
      setTasks(tasksData.filter((t: any) => 
        (typeof t.project === 'object' ? t.project._id : t.project) === projectId
      ));

      const token = localStorage.getItem('auth-token');
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBudget(Array.isArray(data) ? data[0] : data);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!project || !tasks.length) return null;

    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);

    const budgetSpent = budget?.categories?.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0) || 0;
    const budgetTotal = budget?.totalBudget || 0;
    const budgetUtilization = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0;

    return {
      totalTasks: tasks.length,
      completed,
      inProgress,
      overdue,
      completionRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
      totalEstimated,
      timeProgress,
      daysRemaining,
      daysElapsed,
      totalDays,
      isOnTrack: project.progress >= timeProgress,
      budgetSpent,
      budgetTotal,
      budgetUtilization,
      budgetRemaining: budgetTotal - budgetSpent,
      teamSize: project.team?.length || 0,
      efficiency: project.progress > 0 && timeProgress > 0 ? (project.progress / timeProgress) * 100 : 0
    };
  };

  const metrics = calculateMetrics();

  if (!isAuthenticated || loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  if (!project) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name || project.title}</h1>
              <p className="text-muted-foreground">Project Analytics & Insights</p>
            </div>
          </div>
          <Badge className={metrics?.isOnTrack ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {metrics?.isOnTrack ? "On Track" : "At Risk"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Progress</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{project.progress}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">{metrics?.isOnTrack ? 'On schedule' : 'Behind'}</span>
                  </div>
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
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Task Completion</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{metrics?.completionRate.toFixed(0)}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{metrics?.completed}/{metrics?.totalTasks} done</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Budget Used</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{metrics?.budgetUtilization.toFixed(0)}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600">${metrics?.budgetSpent.toLocaleString()}</span>
                  </div>
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
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Efficiency</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{metrics?.efficiency.toFixed(0)}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600">Performance</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Days Elapsed</p>
                  <p className="text-2xl font-bold">{metrics?.daysElapsed}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-2xl font-bold">{metrics?.daysRemaining}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Days</p>
                  <p className="text-2xl font-bold">{metrics?.totalDays}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time Progress</span>
                    <span>{metrics?.timeProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics?.timeProgress} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Work Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Completed</span>
                  </div>
                  <Badge variant="secondary">{metrics?.completed}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">In Progress</span>
                  </div>
                  <Badge variant="secondary">{metrics?.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <span className="font-medium">Overdue</span>
                  </div>
                  <Badge variant="destructive">{metrics?.overdue}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-gray-600" />
                    <span className="font-medium">Total Hours</span>
                  </div>
                  <Badge variant="outline">{metrics?.totalEstimated}h</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budget ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">${metrics?.budgetTotal.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-2xl font-bold">${metrics?.budgetSpent.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span>{metrics?.budgetUtilization.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics?.budgetUtilization} className="h-3" />
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">Remaining Budget</p>
                    <p className="text-2xl font-bold text-green-600">${metrics?.budgetRemaining.toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-muted-foreground">No budget data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                  <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="text-2xl font-bold">{metrics?.teamSize}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <Target className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-muted-foreground">Tasks/Member</p>
                  <p className="text-2xl font-bold">
                    {metrics?.teamSize > 0 ? (metrics.totalTasks / metrics.teamSize).toFixed(1) : 0}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Priority</span>
                  <Badge variant="outline">{project.priority}</Badge>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Status</span>
                  <Badge>{project.status}</Badge>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Start Date</span>
                  <span className="text-sm font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">End Date</span>
                  <span className="text-sm font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`h-5 w-5 ${metrics?.isOnTrack ? 'text-green-600' : 'text-red-600'}`} />
                  <h4 className="font-medium">Schedule Status</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics?.isOnTrack 
                    ? `Project is ${(project.progress - metrics.timeProgress).toFixed(1)}% ahead of schedule`
                    : `Project is ${(metrics.timeProgress - project.progress).toFixed(1)}% behind schedule`
                  }
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`h-5 w-5 ${metrics?.budgetUtilization < 90 ? 'text-green-600' : 'text-orange-600'}`} />
                  <h4 className="font-medium">Budget Health</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics?.budgetUtilization < 90 
                    ? 'Budget is within healthy limits'
                    : 'Budget utilization is high, monitor spending'
                  }
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`h-5 w-5 ${metrics?.completionRate > 50 ? 'text-green-600' : 'text-orange-600'}`} />
                  <h4 className="font-medium">Task Progress</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics?.completionRate > 50 
                    ? 'Good task completion rate'
                    : 'Focus on completing more tasks'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default ProjectAnalytics;
