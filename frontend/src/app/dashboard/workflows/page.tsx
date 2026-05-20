"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Plus, Search, Filter, GitBranch, Clock, CheckCircle2, XCircle,
  AlertTriangle, PauseCircle, Play, BarChart3, ArrowRight, Users,
  Calendar, Zap, TrendingUp, Activity, Eye, MoreHorizontal
} from "lucide-react";
import { workflowsAPI, WorkflowInstance, WorkflowDashboardStats, InstanceStatus } from "@/lib/api/workflowsAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WorkflowsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [pendingActions, setPendingActions] = useState<WorkflowInstance[]>([]);
  const [stats, setStats] = useState<WorkflowDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, instancesRes, pendingRes] = await Promise.all([
        workflowsAPI.getDashboardStats(),
        workflowsAPI.getInstances({ limit: 20, sortBy: 'updatedAt', sortOrder: 'desc' }),
        workflowsAPI.getMyPendingActions()
      ]);
      setStats(statsRes.data);
      setInstances(instancesRes.data);
      setPendingActions(pendingRes.data);
    } catch (error) {
      console.error('Failed to fetch workflow data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const getStatusColor = (status: InstanceStatus) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: InstanceStatus) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'on-hold': return <PauseCircle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const filteredInstances = instances.filter(instance => {
    if (searchTerm && !instance.templateName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !instance.entityTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== 'all' && instance.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && instance.priority !== priorityFilter) return false;
    if (entityFilter !== 'all' && instance.entityType !== entityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-primary" />
            Workflow Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage approvals, track processes, and automate operations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.push('/dashboard/workflows/templates')}>
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/workflows/create-project')}>
            <GitBranch className="h-4 w-4 mr-2" />
            Create Project from Workflow
          </Button>
          <Button onClick={() => router.push('/dashboard/workflows/start')}>
            <Plus className="h-4 w-4 mr-2" />
            Start Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{stats?.statusDistribution?.active || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Pending Actions</p>
                <p className="text-2xl font-bold text-orange-600">{pendingActions.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.statusDistribution?.completed || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold">{stats?.sla?.complianceRate || 100}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            {stats?.sla?.breached ? (
              <p className="text-xs text-red-500 mt-1">{stats.sla.breached} SLA breaches</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="my-actions" className="relative">
            My Actions
            {pendingActions.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                {pendingActions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Pending Actions Alert */}
          {pendingActions.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-800 dark:text-orange-300">
                  <AlertTriangle className="h-4 w-4" />
                  You have {pendingActions.length} pending action{pendingActions.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingActions.slice(0, 3).map(instance => (
                  <div
                    key={instance._id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => router.push(`/dashboard/workflows/${instance._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <GitBranch className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{instance.entityTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {instance.templateName} • Step: {instance.currentStepName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(instance.priority)} variant="secondary">
                        {instance.priority}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                {pendingActions.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('my-actions')}>
                    View all {pendingActions.length} pending actions
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Workflow Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No workflows yet. Start one from a template.</p>
                  <Button variant="outline" className="mt-3" onClick={() => router.push('/dashboard/workflows/start')}>
                    <Plus className="h-4 w-4 mr-2" /> Start Workflow
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {instances.slice(0, 8).map(instance => (
                    <div
                      key={instance._id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/workflows/${instance._id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {instance.initiatedBy?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{instance.entityTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {instance.templateName} • {instance.currentStepName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Progress value={instance.progress} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-8">{instance.progress}%</span>
                        <Badge className={`${getStatusColor(instance.status)} text-xs`} variant="secondary">
                          {getStatusIcon(instance.status)}
                          <span className="ml-1">{instance.status}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {formatTimeAgo(instance.updatedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Actions Tab */}
        <TabsContent value="my-actions" className="space-y-4">
          {pendingActions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No pending workflow actions assigned to you.</p>
              </CardContent>
            </Card>
          ) : (
            pendingActions.map(instance => (
              <Card key={instance._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{instance.entityTitle}</h3>
                        <Badge className={getPriorityColor(instance.priority)} variant="secondary">
                          {instance.priority}
                        </Badge>
                        {instance.slaBreached && (
                          <Badge variant="destructive" className="text-xs">SLA Breached</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {instance.templateName} • Current Step: <span className="font-medium">{instance.currentStepName}</span>
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          By {instance.initiatedBy?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(instance.startedAt)}
                        </span>
                        {instance.projectId && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {typeof instance.projectId === 'object' ? instance.projectId.name : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => router.push(`/dashboard/workflows/${instance._id}`)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <Progress value={instance.progress} className="flex-1 h-2" />
                      <span className="text-xs font-medium">{instance.progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All Workflows Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
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
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="work-order">Work Order</SelectItem>
                <SelectItem value="purchase-order">Purchase Order</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="boq">BOQ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workflow List */}
          {filteredInstances.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No workflows match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredInstances.map(instance => (
                <Card key={instance._id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/workflows/${instance._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${
                          instance.status === 'active' ? 'bg-blue-500' :
                          instance.status === 'completed' ? 'bg-green-500' :
                          instance.status === 'rejected' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{instance.entityTitle}</p>
                            <Badge variant="outline" className="text-xs">{instance.entityType}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {instance.templateName} • {instance.currentStepName} • by {instance.initiatedBy?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        <Progress value={instance.progress} className="w-20 h-1.5 hidden sm:block" />
                        <Badge className={`${getStatusColor(instance.status)} text-xs`} variant="secondary">
                          {instance.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(instance.priority)} text-xs`} variant="secondary">
                          {instance.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden md:inline w-16 text-right">
                          {formatTimeAgo(instance.updatedAt)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/workflows/${instance._id}`); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                <p className="text-2xl font-bold">{stats?.avgCompletionTimeHours || 0}h</p>
                <p className="text-xs text-muted-foreground mt-1">Average hours to complete a workflow</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-2xl font-bold">
                  {Object.values(stats?.statusDistribution || {}).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All-time workflow instances</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="text-2xl font-bold text-red-600">{stats?.sla?.breached || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.sla?.complianceRate || 100}% compliance rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats?.statusDistribution || {}).map(([status, count]) => (
                  <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard/workflows/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Full Analytics
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
