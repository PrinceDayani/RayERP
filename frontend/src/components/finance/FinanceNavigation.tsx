'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BookOpen, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Users,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowRight,
  Zap,
  Target,
  Activity
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const FinanceNavigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  const [notifications] = useState(3);

  const navigationItems = [
    {
      id: 'journal-entries',
      title: 'Journal Entries',
      description: 'Create and manage accounting entries',
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      stats: { total: 156, pending: 12 }
    },
    {
      id: 'ledger',
      title: 'General Ledger',
      description: 'View account balances and transactions',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      stats: { accounts: 45, balance: '$2.4M' }
    },
    {
      id: 'reports',
      title: 'Financial Reports',
      description: 'Generate comprehensive financial reports',
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      stats: { templates: 12, generated: 89 }
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Advanced financial analysis and insights',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      stats: { kpis: 8, alerts: 2 }
    }
  ];

  const quickActions = [
    { icon: Plus, label: 'New Entry', action: () => {} },
    { icon: FileText, label: 'Generate Report', action: () => {} },
    { icon: TrendingUp, label: 'View Analytics', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => {} }
  ];

  const recentActivity = [
    { type: 'entry', description: 'Journal Entry JE0156 created', time: '2 min ago', status: 'success' },
    { type: 'report', description: 'P&L Report generated', time: '15 min ago', status: 'info' },
    { type: 'alert', description: 'Cash flow alert triggered', time: '1 hour ago', status: 'warning' },
    { type: 'entry', description: 'Journal Entry JE0155 posted', time: '2 hours ago', status: 'success' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Finance Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Comprehensive financial management system</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">$1.25M</p>
                  <p className="text-xs text-green-500 font-medium">+12.5% from last month</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600">$234K</p>
                  <p className="text-xs text-blue-500 font-medium">18.7% margin</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cash Flow</p>
                  <p className="text-2xl font-bold text-purple-600">$89K</p>
                  <p className="text-xs text-purple-500 font-medium">Positive trend</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Efficiency</p>
                  <p className="text-2xl font-bold text-orange-600">87%</p>
                  <p className="text-xs text-orange-500 font-medium">Above target</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-300 border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                  isActive 
                    ? 'ring-2 ring-blue-500 bg-white' 
                    : 'bg-white/80 backdrop-blur-sm hover:bg-white'
                }`}
                onClick={() => onSectionChange(item.id)}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${item.bgColor}`}>
                      <IconComponent className={`h-8 w-8 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
                    </div>
                    <ArrowRight className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'translate-x-1' : ''} text-gray-400`} />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    
                    <div className="flex items-center gap-4 pt-2">
                      {Object.entries(item.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-lg font-bold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-500 capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-16 flex flex-col gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300"
                      onClick={action.action}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinanceNavigation;