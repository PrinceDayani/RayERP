'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskAnalyticsDashboard } from '@/components/tasks';
import { BarChart3, TrendingUp, Clock, Users, Target, Calendar } from 'lucide-react';
import tasksAPI from '@/lib/api/tasksAPI';

export default function TaskAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await tasksAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Analytics</h1>
        <p className="text-gray-600">Comprehensive insights into task performance and productivity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{stats?.totalTasks || 0}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{stats?.completionRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold">{stats?.avgCompletionTime || 0}h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdueTasks || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TaskAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">On-Time Completion</span>
                  <span className="text-green-600 font-bold">{stats?.onTimeRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">Average Delay</span>
                  <span className="text-orange-600 font-bold">{stats?.avgDelay || 0} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">Tasks per Week</span>
                  <span className="text-blue-600 font-bold">{stats?.tasksPerWeek || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.topPerformers?.map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{performer.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{performer.completedTasks} tasks</span>
                  </div>
                )) || <p className="text-sm text-gray-500">No data available</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
