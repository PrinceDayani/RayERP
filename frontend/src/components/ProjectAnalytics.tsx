"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Users as UsersIcon, AlertTriangle } from 'lucide-react';

interface AnalyticsProps {
  projectId: string;
}

export default function ProjectAnalytics({ projectId }: AnalyticsProps) {
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
        console.log('Fetching analytics for project:', projectId);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const [burndownRes, velocityRes, utilizationRes, performanceRes, riskRes] = await Promise.all([
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/burndown`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/velocity`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/resource-utilization`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/performance-indices`, { headers }),
          fetch(`${baseUrl}/api/projects/${projectId}/analytics/risk-assessment`, { headers })
        ]);

        const burndownData = await burndownRes.json();
        const velocityData = await velocityRes.json();
        const utilizationData = await utilizationRes.json();
        const performanceData = await performanceRes.json();
        const riskData = await riskRes.json();

        console.log('Analytics data:', { burndownData, velocityData, utilizationData, performanceData, riskData });

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

    fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <p className="text-sm text-muted-foreground">Please check your authentication and try again.</p>
      </div>
    );
  }

  if (!performance && !burndown && !velocity && !utilization && !risk) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No analytics data available for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Performance Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              CPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${performance?.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {performance?.cpi || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cost Performance Index</p>
            <p className="text-xs font-medium mt-1">{performance?.cpi >= 1 ? '✓ Under Budget' : '⚠ Over Budget'}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              SPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${performance?.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {performance?.spi || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Schedule Performance Index</p>
            <p className="text-xs font-medium mt-1">{performance?.spi >= 1 ? '✓ On Schedule' : '⚠ Behind Schedule'}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              risk?.overallRisk === 'low' ? 'text-green-600' : 
              risk?.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {risk?.overallRisk?.toUpperCase() || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{risk?.riskCount || 0} risks identified</p>
            <p className="text-xs font-medium mt-1 capitalize">{risk?.projectHealth || 'Unknown'}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{performance?.status || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">Project Health</p>
            <p className="text-xs font-medium mt-1">Overall Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Burndown Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Burndown Chart
          </CardTitle>
          <p className="text-sm text-muted-foreground">Track work completion over time</p>
        </CardHeader>
        <CardContent className="pt-6">
          {burndown?.burndownData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndown.burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#888" strokeDasharray="5 5" name="Ideal" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No burndown data available</p>
              <p className="text-xs text-muted-foreground mt-2">Complete some tasks to see the burndown chart</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Velocity Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Team Velocity
          </CardTitle>
          <p className="text-sm text-muted-foreground">Average: {velocity?.avgVelocity?.toFixed(1) || 0} hrs/week</p>
        </CardHeader>
        <CardContent className="pt-6">
          {velocity?.velocityData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocity.velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="velocity" fill="#10b981" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No velocity data available</p>
              <p className="text-xs text-muted-foreground mt-2">Complete tasks to track team velocity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Utilization */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-purple-600" />
            Resource Utilization
          </CardTitle>
          <p className="text-sm text-muted-foreground">Team member workload analysis</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {utilization?.utilizationData?.length > 0 ? (
              utilization.utilizationData.map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{u.user?.firstName} {u.user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.completedTasks}/{u.totalTasks} tasks • {u.actualHours}/{u.estimatedHours} hrs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{u.completionRate?.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No team members assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Risk Assessment
          </CardTitle>
          <p className="text-sm text-muted-foreground">Identified project risks and issues</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {risk?.risks?.map((r: any, i: number) => (
              <div key={i} className={`p-3 rounded border-l-4 ${
                r.severity === 'critical' ? 'border-red-600 bg-red-50' :
                r.severity === 'high' ? 'border-orange-600 bg-orange-50' :
                r.severity === 'medium' ? 'border-yellow-600 bg-yellow-50' :
                'border-blue-600 bg-blue-50'
              }`}>
                <div className="flex justify-between">
                  <span className="font-medium">{r.message}</span>
                  <span className="text-sm uppercase">{r.severity}</span>
                </div>
              </div>
            ))}
            {risk?.risks?.length === 0 && (
              <p className="text-muted-foreground">No risks identified</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
