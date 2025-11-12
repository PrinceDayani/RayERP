"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, 
  Calendar, CheckCircle, AlertCircle, Clock, BarChart3,
  Activity, Target, Zap, Award
} from "lucide-react";
import { getProjectStats, getAllProjects } from "@/lib/api/projectsAPI";

const ProjectAnalyticsDashboard = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [budgetAnalytics, setBudgetAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsData, projectsData, budgetData, tasksData] = await Promise.all([
        getProjectStats(),
        getAllProjects(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/analytics`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      
      setStats({
        ...statsData,
        totalTasks: tasksData.length,
        completedTasks: tasksData.filter((t: any) => t.status === 'completed').length,
        overdueTasks: tasksData.filter((t: any) => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
      });
      setProjects(projectsData);
      setBudgetAnalytics(budgetData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!projects.length) return null;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.spentBudget || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length;
    const onTimeProjects = projects.filter(p => {
      const endDate = new Date(p.endDate);
      return endDate >= new Date() || p.status === 'completed';
    }).length;

    return {
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      avgProgress: avgProgress.toFixed(1),
      onTimeRate: ((onTimeProjects / projects.length) * 100).toFixed(1),
      efficiency: avgProgress > 0 ? ((onTimeProjects / projects.length) * avgProgress).toFixed(1) : 0
    };
  };

  const metrics = calculateMetrics();

  if (!isAuthenticated) {
    return (
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to access Analytics</p>
              <Button onClick={() => router.push("/login")}>Login</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Projects</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats?.totalProjects || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">{stats?.activeProjects || 0} active</span>
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
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Projects</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats?.activeProjects || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{metrics?.avgProgress}% avg progress</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {stats?.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(1) : 0}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600">{stats?.completedProjects || 0} completed</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Budget Efficiency</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {metrics?.budgetUtilization.toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600">₹{metrics?.totalSpent.toLocaleString()} spent</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                      <p className="text-xl font-bold">₹{metrics?.totalBudget.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Team Members</p>
                      <p className="text-xl font-bold">{projects.reduce((sum, p) => sum + (p.team?.length || 0), 0)}</p>
                    </div>
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Progress</p>
                      <p className="text-xl font-bold">{metrics?.avgProgress}%</p>
                    </div>
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">On-Time Rate</p>
                      <p className="text-xl font-bold">{metrics?.onTimeRate}%</p>
                    </div>
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Active</span>
                        <span className="text-sm text-muted-foreground">{stats?.activeProjects || 0}</span>
                      </div>
                      <Progress value={(stats?.activeProjects / stats?.totalProjects) * 100 || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Completed</span>
                        <span className="text-sm text-muted-foreground">{stats?.completedProjects || 0}</span>
                      </div>
                      <Progress value={(stats?.completedProjects / stats?.totalProjects) * 100 || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Planning</span>
                        <span className="text-sm text-muted-foreground">
                          {projects.filter(p => p.status === 'planning').length}
                        </span>
                      </div>
                      <Progress 
                        value={(projects.filter(p => p.status === 'planning').length / stats?.totalProjects) * 100 || 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Tasks</p>
                          <p className="text-2xl font-bold">{stats?.totalTasks || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {stats?.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Overdue</p>
                          <p className="text-2xl font-bold">{stats?.overdueTasks || 0}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects
                      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
                      .slice(0, 5)
                      .map((project) => (
                        <div 
                          key={project._id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{project.name || project.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{project.status}</Badge>
                              <Badge variant="secondary" className="text-xs">{project.priority}</Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl font-bold text-green-600">{project.progress}%</p>
                            <Progress value={project.progress} className="w-20 mt-1" />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projects by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map(priority => {
                      const count = projects.filter(p => p.priority === priority).length;
                      const percentage = stats?.totalProjects > 0 ? (count / stats.totalProjects) * 100 : 0;
                      const colors = {
                        critical: 'bg-red-500',
                        high: 'bg-orange-500',
                        medium: 'bg-yellow-500',
                        low: 'bg-green-500'
                      };
                      return (
                        <div key={priority}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{priority}</span>
                            <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`${colors[priority as keyof typeof colors]} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projects.map(project => {
                    const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const budgetHealth = project.budget > 0 ? ((project.spentBudget || 0) / project.budget) * 100 : 0;
                    const scheduleHealth = daysRemaining < 0 ? 0 : daysRemaining < 7 ? 50 : 100;
                    const progressHealth = project.progress;
                    const overallHealth = (budgetHealth <= 90 ? 100 : 50) * 0.3 + scheduleHealth * 0.3 + progressHealth * 0.4;
                    
                    const healthColor = overallHealth >= 70 ? 'text-green-600' : overallHealth >= 40 ? 'text-yellow-600' : 'text-red-600';
                    const healthBg = overallHealth >= 70 ? 'bg-green-50 border-green-200' : overallHealth >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
                    
                    return (
                      <Card key={project._id} className={`${healthBg} cursor-pointer`} onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm mb-2 truncate">{project.name}</h4>
                          <div className="text-center mb-3">
                            <p className={`text-3xl font-bold ${healthColor}`}>{overallHealth.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Health Score</p>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Progress</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Budget</span>
                              <span className="font-medium">{budgetHealth.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Schedule</span>
                              <span className="font-medium">{daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Target className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                    <p className="text-sm text-muted-foreground">On-Time Delivery</p>
                    <p className="text-3xl font-bold">{metrics?.onTimeRate}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto text-green-600 mb-3" />
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                    <p className="text-3xl font-bold">{metrics?.avgProgress}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto text-orange-600 mb-3" />
                    <p className="text-sm text-muted-foreground">Efficiency Score</p>
                    <p className="text-3xl font-bold">{metrics?.efficiency}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Performance Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => {
                    const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isOnTrack = project.progress >= 50 && daysRemaining > 0;
                    
                    return (
                      <div key={project._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{project.name || project.title}</h4>
                          <Badge variant={isOnTrack ? "default" : "destructive"}>
                            {isOnTrack ? "On Track" : "At Risk"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Progress</p>
                            <p className="font-medium">{project.progress}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Remaining</p>
                            <p className="font-medium">{daysRemaining > 0 ? daysRemaining : 'Overdue'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Team Size</p>
                            <p className="font-medium">{project.team?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Allocated</p>
                      <p className="text-2xl font-bold">₹{metrics?.totalBudget.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">₹{metrics?.totalSpent.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold">₹{(metrics?.totalBudget - metrics?.totalSpent).toLocaleString()}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-blue-600">{metrics?.budgetUtilization.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-2">of total budget utilized</p>
                    </div>
                    <Progress value={metrics?.budgetUtilization} className="h-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-muted-foreground">Approved Budgets</p>
                        <p className="text-xl font-bold">{budgetAnalytics?.summary?.approvedBudgets || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-muted-foreground">Pending Approvals</p>
                        <p className="text-xl font-bold">{budgetAnalytics?.summary?.pendingApprovals || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects
                    .filter(p => p.budget > 0)
                    .sort((a, b) => (b.budget || 0) - (a.budget || 0))
                    .map((project) => {
                      const utilization = project.budget > 0 ? (project.spentBudget / project.budget) * 100 : 0;
                      return (
                        <div key={project._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{project.name || project.title}</h4>
                            <Badge variant={utilization > 90 ? "destructive" : utilization > 70 ? "default" : "secondary"}>
                              {utilization.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>₹{project.spentBudget?.toLocaleString() || 0} / ₹{project.budget?.toLocaleString() || 0}</span>
                            <span>₹{(project.budget - project.spentBudget)?.toLocaleString() || 0} remaining</span>
                          </div>
                          <Progress value={utilization} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects
                    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                    .map((project) => {
                      const startDate = new Date(project.startDate);
                      const endDate = new Date(project.endDate);
                      const today = new Date();
                      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      const timeProgress = Math.min((daysElapsed / totalDays) * 100, 100);
                      const isDelayed = timeProgress > project.progress;

                      return (
                        <div key={project._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{project.name || project.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant={isDelayed ? "destructive" : "default"}>
                              {isDelayed ? "Delayed" : "On Schedule"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Time Progress</span>
                                <span>{timeProgress.toFixed(1)}%</span>
                              </div>
                              <Progress value={timeProgress} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Work Progress</span>
                                <span>{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default ProjectAnalyticsDashboard;
