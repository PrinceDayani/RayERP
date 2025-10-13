'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { useAnalytics } from '@/hooks/finance/useAnalytics';

export default function AnalyticsPage() {
  const { kpis, loading, fetchKPIs } = useAnalytics();
  const [stats, setStats] = useState({
    totalKPIs: 0,
    activeMetrics: 0,
    performanceScore: 0,
    trendsTracked: 0
  });

  useEffect(() => {
    fetchKPIs();
  }, []);

  const modules = [
    {
      title: 'Key Performance Indicators',
      description: 'Track and monitor financial KPIs',
      href: '/dashboard/finance/analytics/kpis',
      icon: BarChart3,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Revenue Trends',
      description: 'Analyze revenue patterns and growth',
      href: '/dashboard/finance/analytics/revenue-trends',
      icon: TrendingUp,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Profitability Analysis',
      description: 'Examine profit margins and efficiency',
      href: '/dashboard/finance/analytics/profitability',
      icon: PieChart,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Financial Health Score',
      description: 'Overall financial health assessment',
      href: '/dashboard/finance/analytics/financial-health',
      icon: Activity,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze performance, trends, and financial health</p>
        </div>
        <Button onClick={fetchKPIs} disabled={loading}>
          <BarChart3 className="w-4 h-4 mr-2" />
          {loading ? 'Refreshing...' : 'Refresh Analytics'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKPIs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeMetrics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.performanceScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trends Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.trendsTracked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className={`cursor-pointer transition-all ${module.color}`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Icon className="w-8 h-8 text-gray-700" />
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}