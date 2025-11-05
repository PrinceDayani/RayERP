'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, FileText, TrendingUp, BarChart3, DollarSign, Receipt, Building2, Users } from 'lucide-react';

export default function FinancePage() {
  const router = useRouter();

  const financeModules = [
    {
      title: 'General Ledger',
      description: 'Complete accounting system with chart of accounts',
      icon: Calculator,
      path: '/dashboard/general-ledger',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Journal Entries',
      description: 'Create and manage journal entries',
      icon: FileText,
      path: '/dashboard/finance/journal-entry',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Trial Balance',
      description: 'View trial balance and verify accounts',
      icon: BarChart3,
      path: '/dashboard/finance/trial-balance',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Profit & Loss',
      description: 'Income statement and P&L reports',
      icon: TrendingUp,
      path: '/dashboard/finance/profit-loss',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities and equity statement',
      icon: DollarSign,
      path: '/dashboard/finance/balance-sheet',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Cash Flow',
      description: 'Cash flow statement and analysis',
      icon: Receipt,
      path: '/dashboard/finance/cash-flow',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Project Ledger',
      description: 'Project-wise financial tracking',
      icon: Building2,
      path: '/dashboard/finance/project-ledger',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Financial Reports',
      description: 'Comprehensive financial reporting',
      icon: Users,
      path: '/dashboard/finance/reports',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finance & Accounting</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial management system</p>
        </div>
        <Button onClick={() => router.push('/dashboard/general-ledger')}>
          <Calculator className="w-4 h-4 mr-2" />
          General Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financeModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card 
              key={module.path} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(module.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${module.bgColor}`}>
                    <Icon className={`w-8 h-8 ${module.color}`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/general-ledger')}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Create Journal Entry
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/finance/trial-balance')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Trial Balance
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/finance/reports')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Journal Entry JE000001</span>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trial Balance Generated</span>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Created: Office Rent</span>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Assets</span>
                <span className="font-semibold">₹5,25,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Liabilities</span>
                <span className="font-semibold">₹2,15,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Net Worth</span>
                <span className="font-semibold text-green-600">₹3,10,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}