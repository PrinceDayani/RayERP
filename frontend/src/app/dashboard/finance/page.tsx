'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFinance } from '@/hooks/useFinance';
import FinanceDashboard from '@/components/finance/FinanceDashboard';

export default function FinancePage() {
  const { dashboard, loading, fetchDashboard, updateSummary } = useFinance();
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (dashboard?.summary) {
      setSummary(dashboard.summary);
    }
  }, [dashboard]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const financeModules = [
    {
      title: 'General Ledger',
      description: 'Chart of accounts, journal entries, and ledger management',
      href: '/dashboard/finance/general-ledger',
      icon: '📊',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Budgeting',
      description: 'Budget planning, allocations, and variance analysis',
      href: '/dashboard/finance/budgeting',
      icon: '📈',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Accounts',
      description: 'Client accounts, aging reports, and credit management',
      href: '/dashboard/finance/accounts',
      icon: '👥',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Expenses',
      description: 'Expense claims, approvals, and reimbursements',
      href: '/dashboard/finance/expenses',
      icon: '💳',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: 'Cost Accounting',
      description: 'Cost centers, allocations, and project costs',
      href: '/dashboard/finance/cost-accounting',
      icon: '🏭',
      color: 'bg-red-50 border-red-200'
    },
    {
      title: 'WIP Accounting',
      description: 'Work orders, material consumption, and production costs',
      href: '/dashboard/finance/wip-accounting',
      icon: '⚙️',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      title: 'Reports',
      description: 'Balance sheet, P&L, cash flow, and custom reports',
      href: '/dashboard/finance/reports',
      icon: '📋',
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Analytics',
      description: 'KPIs, financial ratios, and performance metrics',
      href: '/dashboard/finance/analytics',
      icon: '📊',
      color: 'bg-teal-50 border-teal-200'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
      
      <FinanceDashboard 
        summary={summary} 
        onRefresh={updateSummary} 
        loading={loading} 
      />

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Finance Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financeModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <div className={`p-6 rounded-lg border-2 hover:shadow-lg transition-all cursor-pointer ${module.color}`}>
                <div className="text-3xl mb-3">{module.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}