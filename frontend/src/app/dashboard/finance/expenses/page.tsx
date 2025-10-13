'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, CheckCircle, DollarSign, User } from 'lucide-react';
import { useExpenses } from '@/hooks/finance/useExpenses';

export default function ExpensesPage() {
  const { expenses, loading, fetchExpenses } = useExpenses();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApproval: 0,
    totalAmount: 0,
    reimbursed: 0
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const modules = [
    {
      title: 'Submit Expense Claim',
      description: 'Submit new expense claims with receipts',
      href: '/dashboard/finance/expenses/submit-claim',
      icon: Receipt,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Expense Approvals',
      description: 'Review and approve pending expense claims',
      href: '/dashboard/finance/expenses/approvals',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Reimbursements',
      description: 'Process approved expense reimbursements',
      href: '/dashboard/finance/expenses/reimbursements',
      icon: DollarSign,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'My Expenses',
      description: 'View your personal expense history',
      href: '/dashboard/finance/expenses/my-expenses',
      icon: User,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Submit, approve, and manage expense claims</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/finance/expenses/submit-claim">
            <Plus className="w-4 h-4 mr-2" />
            Submit Expense
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reimbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.reimbursed.toLocaleString()}
            </div>
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