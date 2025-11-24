'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsProps {
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TaskAnalyticsDashboard({ projectId, startDate, endDate }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [burndown, setBurndown] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [analyticsRes, velocityRes, performanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/analytics?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/analytics/velocity?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/analytics/team-performance?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        })
      ]);

      setAnalytics(await analyticsRes.json());
      setVelocity(await velocityRes.json());
      setPerformance(await performanceRes.json());
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analytics?.statusBreakdown || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
                {analytics?.statusBreakdown?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Velocity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Velocity (Last 5 Sprints)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={velocity?.velocity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#8884d8" name="Tasks Completed" />
              <Bar dataKey="estimatedHours" fill="#82ca9d" name="Estimated Hours" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-2">
            Average Velocity: {velocity?.avgVelocity?.toFixed(1)} tasks/sprint
          </p>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performance?.performance?.map((member: any) => (
              <div key={member._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.completedTasks}/{member.totalTasks} tasks ({member.completionRate?.toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Efficiency: {member.efficiency?.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold">
              {((analytics?.completionRate?.completed / analytics?.completionRate?.total) * 100 || 0).toFixed(1)}%
            </div>
            <p className="text-muted-foreground mt-2">
              {analytics?.completionRate?.completed} of {analytics?.completionRate?.total} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
