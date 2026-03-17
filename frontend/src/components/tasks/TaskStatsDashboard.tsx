"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Target,
  Users,
  Calendar,
  BarChart3,
  Activity,
  Zap
} from "lucide-react";

interface TaskStatsDashboardProps {
  tasks: any[];
  projectId?: string;
}

export function TaskStatsDashboard({ tasks, projectId }: TaskStatsDashboardProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    calculateStats();
  }, [tasks]);

  const calculateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;

    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const dueSoon = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const critical = tasks.filter(t => t.priority === 'critical').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;

    // Task type breakdown
    const individual = tasks.filter(t => (t as any).taskType === 'individual').length;
    const project = tasks.filter(t => (t as any).taskType === 'project').length;

    // Time tracking
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalLogged = tasks.reduce((sum, t) => {
      const timeEntries = t.timeEntries || [];
      return sum + timeEntries.reduce((s: number, e: any) => s + (e.duration || 0), 0);
    }, 0);
    const totalLoggedHours = Math.floor(totalLogged / 60);

    // Assignee stats
    const assigneeMap = new Map();
    tasks.forEach(t => {
      if (t.assignedTo) {
        const id = typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo;
        const name = typeof t.assignedTo === 'object' 
          ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
          : 'Unknown';
        
        if (!assigneeMap.has(id)) {
          assigneeMap.set(id, { name, total: 0, completed: 0 });
        }
        const stats = assigneeMap.get(id);
        stats.total++;
        if (t.status === 'completed') stats.completed++;
      }
    });

    const topPerformers = Array.from(assigneeMap.values())
      .map((s: any) => ({
        ...s,
        completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    setStats({
      total,
      completed,
      inProgress,
      todo,
      review,
      blocked,
      overdue,
      dueSoon,
      completionRate,
      priority: { critical, high, medium, low },
      taskType: { individual, project },
      time: { estimated: totalEstimated, logged: totalLoggedHours },
      topPerformers,
    });
  };

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Tasks</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{stats.individual} individual</span>
              <span>{stats.project} project</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.todo} to do, {stats.review} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.dueSoon} due within 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm">To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.todo}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.total > 0 ? Math.round((stats.todo / stats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.inProgress}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.review}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.total > 0 ? Math.round((stats.review / stats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.completed}</span>
                <span className="text-xs text-muted-foreground">
                  ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
            {stats.blocked > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.blocked}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Critical', count: stats.priority.critical, color: 'bg-red-500' },
                { label: 'High', count: stats.priority.high, color: 'bg-orange-500' },
                { label: 'Medium', count: stats.priority.medium, color: 'bg-yellow-500' },
                { label: 'Low', count: stats.priority.low, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Estimated Hours</span>
                <span className="text-2xl font-bold">{stats.time.estimated}h</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Logged Hours</span>
                <span className="text-2xl font-bold">{stats.time.logged}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Utilization</span>
                <span className="text-lg font-bold">
                  {stats.time.estimated > 0 
                    ? Math.round((stats.time.logged / stats.time.estimated) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {stats.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformers.map((performer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{performer.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {performer.completed}/{performer.total} tasks
                    </span>
                    <Badge variant={performer.completionRate >= 80 ? "default" : "secondary"}>
                      {performer.completionRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
