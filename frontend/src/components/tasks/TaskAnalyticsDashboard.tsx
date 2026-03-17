"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  BarChart3,
  Activity
} from "lucide-react";

interface TaskAnalyticsDashboardProps {
  projectId?: string;
}

export function TaskAnalyticsDashboard({ projectId }: TaskAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30");
  const [analytics, setAnalytics] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const [analyticsData, velocityData, teamData] = await Promise.all([
        tasksAPI.getAnalytics(projectId, startDate.toISOString(), endDate.toISOString()),
        tasksAPI.getVelocity(projectId),
        tasksAPI.getTeamPerformance(projectId),
      ]);

      setAnalytics(analyticsData);
      setVelocity(velocityData);
      setTeamPerformance(teamData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = analytics?.completionRate || 0;
  const avgCompletionTime = analytics?.avgCompletionTime || 0;
  const overdueCount = analytics?.overdueCount || 0;
  const velocityTrend = velocity?.trend || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {completionRate >= 70 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Good performance</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Needs improvement</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Completion Time</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{avgCompletionTime}d</div>
            <p className="text-sm text-muted-foreground mt-2">
              Average days to complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overdue Tasks</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold">{overdueCount}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Velocity</span>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold">{velocity?.current || 0}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {velocityTrend >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{velocityTrend}% vs last period</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{velocityTrend}% vs last period</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.statusDistribution?.map((item: any) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.status.replace("-", " ")}</span>
                    <span className="font-medium">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.priorityDistribution?.map((item: any) => (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.priority}</span>
                    <span className="font-medium">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.priority === "critical"
                          ? "bg-red-500"
                          : item.priority === "high"
                          ? "bg-orange-500"
                          : item.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      {teamPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.members?.map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{member.tasksCompleted} completed</span>
                      <span>{member.tasksInProgress} in progress</span>
                      <span>{member.avgCompletionTime}d avg time</span>
                    </div>
                  </div>
                  <Badge variant={member.performance >= 80 ? "default" : "secondary"}>
                    {member.performance}% efficiency
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
