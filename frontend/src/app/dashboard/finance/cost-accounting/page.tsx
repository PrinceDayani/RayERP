'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, PieChart, Briefcase } from 'lucide-react';
import { useCostAccounting } from '@/hooks/finance/useCostAccounting';

export default function CostAccountingPage() {
  const { costCenters, loading, fetchCostCenters } = useCostAccounting();
  const [stats, setStats] = useState({
    totalCenters: 0,
    activeCenters: 0,
    totalBudget: 0,
    totalVariance: 0
  });

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const modules = [
    {
      title: 'Cost Centers',
      description: 'Manage cost center hierarchy and budgets',
      href: '/dashboard/finance/cost-accounting/cost-centers',
      icon: Building,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Cost Allocations',
      description: 'Allocate costs across departments',
      href: '/dashboard/finance/cost-accounting/allocations',
      icon: PieChart,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Project Costs',
      description: 'Track project-specific cost allocation',
      href: '/dashboard/finance/cost-accounting/project-costs',
      icon: Briefcase,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Accounting</h1>
          <p className="text-gray-600 mt-1">Manage cost centers, allocations, and project costs</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/cost-accounting/cost-centers">
            <Plus className="w-4 h-4 mr-2" />
            New Cost Center
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCenters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCenters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalVariance >= 0 ? '+' : ''}${stats.totalVariance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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