"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, BarChart3, TrendingUp, Clock, AlertTriangle,
  CheckCircle2, Activity, Target
} from "lucide-react";
import { workflowsAPI, WorkflowDashboardStats } from "@/lib/api/workflowsAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface PerformanceItem {
  templateId: string;
  templateName: string;
  totalCompleted: number;
  avgDurationHours: number;
  slaBreaches: number;
  slaComplianceRate: number;
}

interface BottleneckItem {
  stepId: string;
  stepName: string;
  stepType: string;
  avgDurationHours: number;
  maxDurationHours: number;
  executionCount: number;
  slaBreaches: number;
}

export default function WorkflowAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<WorkflowDashboardStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceItem[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const dateFrom = new Date();
        if (dateRange === '7d') dateFrom.setDate(dateFrom.getDate() - 7);
        else if (dateRange === '30d') dateFrom.setDate(dateFrom.getDate() - 30);
        else if (dateRange === '90d') dateFrom.setDate(dateFrom.getDate() - 90);
        else dateFrom.setFullYear(dateFrom.getFullYear() - 1);

        const params = { dateFrom: dateFrom.toISOString() };

        const [statsRes, perfRes, bottleneckRes] = await Promise.all([
          workflowsAPI.getDashboardStats(params),
          workflowsAPI.getPerformanceReport(params),
          workflowsAPI.getBottleneckAnalysis()
        ]);

        setStats(statsRes.data);
        setPerformance(perfRes.data);
        setBottlenecks(bottleneckRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalWorkflows = Object.values(stats?.statusDistribution || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/dashboard/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workflows
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Workflow Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics, bottlenecks, and SLA compliance
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{totalWorkflows}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                <p className="text-2xl font-bold">{stats?.avgCompletionTimeHours || 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold text-green-600">{stats?.sla?.complianceRate || 100}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="text-2xl font-bold text-red-600">{stats?.sla?.breached || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats?.statusDistribution || {}).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm capitalize w-24">{status}</span>
                <div className="flex-1">
                  <Progress value={totalWorkflows > 0 ? (count / totalWorkflows) * 100 : 0} className="h-3" />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {totalWorkflows > 0 ? Math.round((count / totalWorkflows) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance by Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No completed workflows in this period</p>
            ) : (
              <div className="space-y-4">
                {performance.map(item => (
                  <div key={item.templateId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{item.templateName}</span>
                      <Badge variant="outline" className="text-xs">{item.totalCompleted} completed</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Avg: {item.avgDurationHours}h</span>
                      <span className={item.slaComplianceRate < 80 ? 'text-red-500' : 'text-green-600'}>
                        SLA: {item.slaComplianceRate}%
                      </span>
                      {item.slaBreaches > 0 && (
                        <span className="text-red-500">{item.slaBreaches} breaches</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottleneck Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Bottleneck Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bottlenecks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No bottleneck data available</p>
            ) : (
              <div className="space-y-4">
                {bottlenecks.slice(0, 8).map((item, index) => (
                  <div key={item.stepId} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.stepName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{item.stepType}</Badge>
                        <span>Avg: {item.avgDurationHours}h</span>
                        <span>Max: {item.maxDurationHours}h</span>
                        <span>{item.executionCount} runs</span>
                      </div>
                    </div>
                    {item.slaBreaches > 0 && (
                      <Badge variant="destructive" className="text-xs">{item.slaBreaches} SLA</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
