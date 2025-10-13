'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Filter, PieChart, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useBudgets } from '@/hooks/finance/useBudgets';

export default function BudgetingPage() {
  const { budgets, loading, fetchBudgets } = useBudgets();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Budgeting</h1>
            <p className="text-sm text-gray-600 mt-1">Plan, allocate, and track budget performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budgets</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Budgets</p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <PieChart className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-2xl font-semibold text-gray-900">$450,000</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variance</p>
                <p className="text-2xl font-semibold text-green-600">+$15,000</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/finance/budgeting/create-budget">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Create Budget</h3>
              </div>
              <p className="text-sm text-gray-600">Set up new budget plans and allocations</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/budgeting/allocations">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PieChart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Budget Allocations</h3>
              </div>
              <p className="text-sm text-gray-600">Manage budget distributions by department</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/budgeting/vs-actual">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Budget vs Actual</h3>
              </div>
              <p className="text-sm text-gray-600">Compare budgeted vs actual performance</p>
            </div>
          </Link>
          
          <Link href="/dashboard/finance/budgeting/forecasts">
            <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Budget Forecasts</h3>
              </div>
              <p className="text-sm text-gray-600">View budget projections and trends</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}