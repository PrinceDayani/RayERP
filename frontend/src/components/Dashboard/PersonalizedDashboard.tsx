"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, Briefcase, CheckSquare, Clock, TrendingUp, Calendar,
  Activity, FileText, AlertCircle, ArrowRight, DollarSign, Target
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import api from "@/lib/api/api";

interface PersonalizedDashboardData {
  projects: any[];
  tasks: any[];
  taskStats: any;
  notifications: any[];
  projectActivity: any[];
  userActivity: any[];
  budgets?: any[];
  financials?: any;
  permissions: {
    finance: boolean;
    budget: boolean;
    projects: boolean;
    tasks: boolean;
  };
}

export default function PersonalizedDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PersonalizedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/user-dashboard');
      setData(response.data.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load dashboard data';
      setError(msg);
      
      // Handle authentication errors
      if (err?.response?.status === 401) {
        localStorage.removeItem('auth-token');
        router.replace('/login');
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to view the dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); fetchDashboardData(); }}>Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg p-6 border">
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground mt-1">Here's your personalized overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Projects"
            value={data.projects.length}
            subtitle="Active projects"
            icon={Briefcase}
            color="blue"
            onClick={() => router.push('/dashboard/projects')}
          />
          <StatCard
            title="My Tasks"
            value={data.taskStats.total}
            subtitle={`${data.taskStats.overdue} overdue`}
            icon={CheckSquare}
            color="green"
            onClick={() => router.push('/dashboard/tasks')}
          />
          <StatCard
            title="Notifications"
            value={data.notifications.length}
            subtitle="Unread"
            icon={Bell}
            color="orange"
            onClick={() => router.push('/dashboard/notifications')}
          />
          <StatCard
            title="In Progress"
            value={data.taskStats.inProgress}
            subtitle="Active tasks"
            icon={Activity}
            color="purple"
          />
        </div>

        {/* Financial Overview - Only if user has finance permission */}
        {data.permissions.finance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.financials ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <FinanceCard
                    title="Sales Revenue"
                    value={formatINR(data.financials.salesRevenue)}
                    subtitle={`${data.financials.salesCount} invoices`}
                    icon={TrendingUp}
                    color="green"
                  />
                  <FinanceCard
                    title="Amount Received"
                    value={formatINR(data.financials.salesPaid)}
                    subtitle="Collected"
                    icon={Calendar}
                    color="blue"
                  />
                  <FinanceCard
                    title="Project Budget"
                    value={formatINR(data.financials.projectBudget)}
                    subtitle={`${formatINR(data.financials.projectSpent)} spent`}
                    icon={Target}
                    color="purple"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No financial data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Budget Status - Only if user has budget permission */}
        {data.permissions.budget && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Budget Status
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/budgets')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {data.budgets && data.budgets.length > 0 ? (
                <div className="space-y-3">
                  {data.budgets.slice(0, 5).map((budget: any) => (
                    <div key={budget._id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{budget.budgetName || budget.projectName || budget.departmentName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatINR(budget.actualSpent)} / {formatINR(budget.totalBudget)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={budget.status === 'approved' ? 'default' : budget.status === 'pending' ? 'secondary' : 'outline'}>
                            {budget.status}
                          </Badge>
                          {budget.userApprovalStatus !== 'not-required' && (
                            <Badge variant={budget.userApprovalStatus === 'approved' ? 'default' : 'secondary'}>
                              {budget.userApprovalStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={budget.utilizationPercentage} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No budgets assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* My Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Projects
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/projects')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {data.projects.length > 0 ? (
                <div className="space-y-3">
                  {data.projects.slice(0, 5).map((project: any) => (
                    <div
                      key={project._id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{project.name}</span>
                        <Badge>{project.status}</Badge>
                      </div>
                      <Progress value={project.progress} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{project.progress}% complete</span>
                        <span>{formatINR(project.spentBudget)} / {formatINR(project.budget)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No projects assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                My Tasks
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/tasks')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {data.tasks.length > 0 ? (
                <div className="space-y-2">
                  {data.tasks.slice(0, 8).map((task: any) => (
                    <div
                      key={task._id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.project && (
                            <p className="text-xs text-muted-foreground">{task.project.name}</p>
                          )}
                        </div>
                        <Badge variant={task.priority === 'high' || task.priority === 'critical' ? 'destructive' : 'secondary'} className="ml-2">
                          {task.priority}
                        </Badge>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                            <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Project Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.projectActivity.length > 0 ? (
                <div className="space-y-3">
                  {data.projectActivity.slice(0, 8).map((activity: any) => (
                    <div key={activity._id} className="flex gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {activity.resourceType === 'task' && <CheckSquare className="h-4 w-4 text-primary" />}
                        {activity.resourceType === 'file' && <FileText className="h-4 w-4 text-primary" />}
                        {activity.resourceType === 'budget' && <DollarSign className="h-4 w-4 text-primary" />}
                        {activity.resourceType === 'project' && <Briefcase className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/notifications')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {data.notifications.length > 0 ? (
                <div className="space-y-2">
                  {data.notifications.slice(0, 8).map((notification: any) => (
                    <div
                      key={notification._id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => notification.actionUrl && router.push(notification.actionUrl)}
                    >
                      <div className="flex gap-2">
                        <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                          notification.priority === 'urgent' ? 'text-red-500' :
                          notification.priority === 'high' ? 'text-orange-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No new notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }: any) => {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-3xl font-bold mb-2">{value}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

const FinanceCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
  const colorClasses = {
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500'
  };

  const iconColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`border-l-4 rounded-lg p-5 bg-card ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-2xl font-bold mb-1">{value}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Icon className={`h-9 w-9 ${iconColors[color]}`} />
      </div>
    </div>
  );
};
