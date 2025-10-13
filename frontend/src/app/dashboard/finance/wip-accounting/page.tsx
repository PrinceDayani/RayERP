'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Users, Settings, DollarSign, Factory } from 'lucide-react';
import { useWIP } from '@/hooks/finance/useWIP';

export default function WIPAccountingPage() {
  const { workOrders, loading, fetchWorkOrders } = useWIP();
  const [stats, setStats] = useState({
    totalOrders: 0,
    inProgress: 0,
    totalWIPValue: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const modules = [
    {
      title: 'Work Orders',
      description: 'Manage production work orders and scheduling',
      href: '/dashboard/finance/wip-accounting/work-orders',
      icon: Package,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Material Consumption',
      description: 'Track raw material usage and costs',
      href: '/dashboard/finance/wip-accounting/material-consumption',
      icon: Factory,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Labor Tracking',
      description: 'Monitor labor hours and costs',
      href: '/dashboard/finance/wip-accounting/labor-tracking',
      icon: Users,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Overhead Allocation',
      description: 'Allocate overhead costs to production',
      href: '/dashboard/finance/wip-accounting/overhead-allocation',
      icon: Settings,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      title: 'Production Costs',
      description: 'Calculate total production costs',
      href: '/dashboard/finance/wip-accounting/production-costs',
      icon: DollarSign,
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WIP Accounting</h1>
          <p className="text-gray-600 mt-1">Track work-in-progress and production costs</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/wip-accounting/work-orders">
            <Plus className="w-4 h-4 mr-2" />
            New Work Order
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total WIP Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalWIPValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
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