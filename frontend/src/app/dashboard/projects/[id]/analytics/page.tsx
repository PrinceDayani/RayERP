"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
        const baseUrl = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

        const [burndownRes, velocityRes, utilizationRes, performanceRes, riskRes] = await Promise.all([
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/burndown`, { headers }).catch(() => ({ json: () => ({ burndownData: [], totalTasks: 0 }) })),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/velocity`, { headers }).catch(() => ({ json: () => ({ velocityData: [], avgVelocity: 0 }) })),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/resource-utilization`, { headers }).catch(() => ({ json: () => ({ utilizationData: [] }) })),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/performance-indices`, { headers }).catch(() => ({ json: () => ({ cpi: 0, spi: 0 }) })),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/risk-assessment`, { headers }).catch(() => ({ json: () => ({ risks: [], overallRisk: 'low' }) }))
        ]);

        const [burndownData, velocityData, utilizationData, performanceData, riskData] = await Promise.all([
          burndownRes.json(),
          velocityRes.json(),
          utilizationRes.json(),
          performanceRes.json(),
          riskRes.json()
        ]);

        setBurndown(burndownData);
        setVelocity(velocityData);
        setUtilization(utilizationData);
        setPerformance(performanceData);
        setRisk(riskData);
        setError(null);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }
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
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Project Analytics</h1>
            <p className="text-sm text-muted-foreground">Real-time performance insights and predictive metrics</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </div>

      <ProjectAnalyticsFiltered view="all" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
    </div>
  );
}
