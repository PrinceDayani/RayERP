"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, BarChart3, Users, AlertTriangle, Activity, FolderKanban, DollarSign } from "lucide-react";
import ProjectAnalyticsFiltered from "@/components/ProjectAnalyticsFiltered";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [burndown, setBurndown] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [utilization, setUtilization] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const [burndownRes, velocityRes, utilizationRes, performanceRes, riskRes] = await Promise.all([
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/burndown`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/velocity`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/resource-utilization`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/performance-indices`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/risk-assessment`, { headers })
        ]);

        setBurndown(await burndownRes.json());
        setVelocity(await velocityRes.json());
        setUtilization(await utilizationRes.json());
        setPerformance(await performanceRes.json());
        setRisk(await riskRes.json());
        setError(null);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)}>Back to Project</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Advanced Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Comprehensive project insights and performance metrics</p>
          </div>
        </div>
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Risks</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Project</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <ProjectAnalyticsFiltered view="all" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <ProjectAnalyticsFiltered view="performance" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <ProjectAnalyticsFiltered view="charts" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <ProjectAnalyticsFiltered view="resources" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <ProjectAnalyticsFiltered view="risks" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="project" className="space-y-6">
          <ProjectAnalyticsFiltered view="project" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <ProjectAnalyticsFiltered view="financial" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
