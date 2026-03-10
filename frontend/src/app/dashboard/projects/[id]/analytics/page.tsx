"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageLoader } from '@/components/PageLoader';
import ProjectAnalyticsFiltered from "@/components/ProjectAnalyticsFiltered";
import ProjectCurrencySwitcher from "@/components/projects/ProjectCurrencySwitcher";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any>(null);
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
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // Validate project ID format
        if (!projectId || projectId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
          setError(`Invalid project ID format: ${projectId}`);
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

        const endpoints = [
          { name: 'project', url: `${baseUrl}/api/projects/${projectId}` },
          { name: 'burndown', url: `${baseUrl}/api/projects/${projectId}/finance/analytics/burndown` },
          { name: 'velocity', url: `${baseUrl}/api/projects/${projectId}/finance/analytics/velocity` },
          { name: 'utilization', url: `${baseUrl}/api/projects/${projectId}/finance/analytics/resource-utilization` },
          { name: 'performance', url: `${baseUrl}/api/projects/${projectId}/finance/analytics/performance-indices` },
          { name: 'risk', url: `${baseUrl}/api/projects/${projectId}/finance/analytics/risk-assessment` }
        ];

        const results: any = {};
        
        const fallback: Record<string, any> = {
          project: { currency: 'INR' },
          burndown: { burndownData: [], totalTasks: 0 },
          velocity: { velocityData: [], avgVelocity: 0 },
          utilization: { utilizationData: [] },
          performance: { cpi: 0, spi: 0 },
          risk: { risks: [], overallRisk: 'low' }
        };

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint.url, { headers });
            results[endpoint.name] = response.ok ? await response.json() : fallback[endpoint.name];
          } catch {
            results[endpoint.name] = fallback[endpoint.name];
          }
        }

        setProject(results.project.data || results.project);
        setBurndown(results.burndown);
        setVelocity(results.velocity);
        setUtilization(results.utilization);
        setPerformance(results.performance);
        setRisk(results.risk);
        setError(null);
      } catch (error) {
        setError(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p className="text-sm">{error}</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Project ID: {projectId}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>Back to Project</Button>
        </div>
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
        <div className="flex items-center gap-3">
          <ProjectCurrencySwitcher />
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </div>
      </div>

      <ProjectAnalyticsFiltered 
        view="all" 
        burndown={burndown} 
        velocity={velocity} 
        utilization={utilization} 
        performance={performance} 
        risk={risk} 
        projectCurrency={project?.currency || 'INR'}
      />
    </div>
  );
}
