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
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Project Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance insights and metrics</p>
        </div>
      </div>

      <ProjectAnalyticsFiltered view="all" burndown={burndown} velocity={velocity} utilization={utilization} performance={performance} risk={risk} />
    </div>
  );
}
