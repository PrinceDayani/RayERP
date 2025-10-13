'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, Calculator, Settings } from 'lucide-react';
import { useReports } from '@/hooks/finance/useReports';

export default function ReportsPage() {
  const { reports, loading, fetchBalanceSheet } = useReports();
  const [stats, setStats] = useState({
    totalReports: 0,
    lastGenerated: 0,
    scheduledReports: 0,
    customReports: 0
  });

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const modules = [
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity statement',
      href: '/dashboard/finance/reports/balance-sheet',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Profit & Loss',
      description: 'Income statement and P&L analysis',
      href: '/dashboard/finance/reports/profit-loss',
      icon: TrendingUp,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing activities',
      href: '/dashboard/finance/reports/cash-flow',
      icon: DollarSign,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Financial Ratios',
      description: 'Key financial ratios and metrics',
      href: '/dashboard/finance/reports/ratios',
      icon: Calculator,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      title: 'Custom Reports',
      description: 'Build and customize financial reports',
      href: '/dashboard/finance/reports/custom-reports',
      icon: Settings,
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view comprehensive financial reports</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/reports/custom-reports">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Last Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.lastGenerated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduledReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custom Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.customReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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