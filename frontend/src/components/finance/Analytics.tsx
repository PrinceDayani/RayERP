'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, DollarSign, Building, Users, Calendar, BarChart3, PieChart, LineChart, Activity, Target, Zap, AlertTriangle, CheckCircle, Download, Filter, RefreshCw, Settings, Eye, ArrowUpRight, ArrowDownRight, Minus, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface FinancialMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  category: 'profitability' | 'liquidity' | 'efficiency' | 'leverage';
  target?: number;
  unit: 'currency' | 'percentage' | 'ratio' | 'days';
}

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  category: string;
  description: string;
}

interface Forecast {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  confidence: number;
}

interface BenchmarkData {
  metric: string;
  company: number;
  industry: number;
  topQuartile: number;
  category: string;
}

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'profit', 'expenses']);
  const [comparisonPeriod, setComparisonPeriod] = useState('previous-year');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetric[]>([
    {
      id: 'revenue',
      name: 'Total Revenue',
      value: 1250000,
      previousValue: 1100000,
      change: 150000,
      changePercent: 13.6,
      trend: 'up',
      category: 'profitability',
      target: 1300000,
      unit: 'currency'
    },
    {
      id: 'gross-profit-margin',
      name: 'Gross Profit Margin',
      value: 42.5,
      previousValue: 38.2,
      change: 4.3,
      changePercent: 11.3,
      trend: 'up',
      category: 'profitability',
      target: 45,
      unit: 'percentage'
    },
    {
      id: 'net-profit-margin',
      name: 'Net Profit Margin',
      value: 18.7,
      previousValue: 15.4,
      change: 3.3,
      changePercent: 21.4,
      trend: 'up',
      category: 'profitability',
      target: 20,
      unit: 'percentage'
    },
    {
      id: 'current-ratio',
      name: 'Current Ratio',
      value: 2.4,
      previousValue: 2.1,
      change: 0.3,
      changePercent: 14.3,
      trend: 'up',
      category: 'liquidity',
      target: 2.5,
      unit: 'ratio'
    },
    {
      id: 'quick-ratio',
      name: 'Quick Ratio',
      value: 1.8,
      previousValue: 1.6,
      change: 0.2,
      changePercent: 12.5,
      trend: 'up',
      category: 'liquidity',
      target: 2.0,
      unit: 'ratio'
    },
    {
      id: 'debt-to-equity',
      name: 'Debt-to-Equity Ratio',
      value: 0.35,
      previousValue: 0.42,
      change: -0.07,
      changePercent: -16.7,
      trend: 'up',
      category: 'leverage',
      target: 0.3,
      unit: 'ratio'
    },
    {
      id: 'roa',
      name: 'Return on Assets',
      value: 12.3,
      previousValue: 10.8,
      change: 1.5,
      changePercent: 13.9,
      trend: 'up',
      category: 'efficiency',
      target: 15,
      unit: 'percentage'
    },
    {
      id: 'roe',
      name: 'Return on Equity',
      value: 18.9,
      previousValue: 16.2,
      change: 2.7,
      changePercent: 16.7,
      trend: 'up',
      category: 'efficiency',
      target: 20,
      unit: 'percentage'
    }
  ]);

  const [kpis, setKpis] = useState<KPI[]>([
    {
      id: 'monthly-revenue',
      name: 'Monthly Revenue',
      value: 104167,
      target: 108333,
      unit: 'USD',
      trend: 'up',
      change: 8.5,
      category: 'Revenue',
      description: 'Monthly recurring revenue target'
    },
    {
      id: 'customer-acquisition-cost',
      name: 'Customer Acquisition Cost',
      value: 245,
      target: 200,
      unit: 'USD',
      trend: 'down',
      change: -12.5,
      category: 'Marketing',
      description: 'Cost to acquire new customers'
    },
    {
      id: 'cash-conversion-cycle',
      name: 'Cash Conversion Cycle',
      value: 45,
      target: 30,
      unit: 'days',
      trend: 'down',
      change: -15.2,
      category: 'Operations',
      description: 'Time to convert investments to cash'
    },
    {
      id: 'employee-productivity',
      name: 'Revenue per Employee',
      value: 125000,
      target: 130000,
      unit: 'USD',
      trend: 'up',
      change: 6.8,
      category: 'HR',
      description: 'Revenue generated per employee'
    }
  ]);

  const monthlyData = [
    { month: 'Jan', revenue: 95000, expenses: 72000, profit: 23000, cashFlow: 18000 },
    { month: 'Feb', revenue: 102000, expenses: 75000, profit: 27000, cashFlow: 22000 },
    { month: 'Mar', revenue: 98000, expenses: 73000, profit: 25000, cashFlow: 20000 },
    { month: 'Apr', revenue: 108000, expenses: 78000, profit: 30000, cashFlow: 25000 },
    { month: 'May', revenue: 115000, expenses: 82000, profit: 33000, cashFlow: 28000 },
    { month: 'Jun', revenue: 122000, expenses: 85000, profit: 37000, cashFlow: 32000 },
    { month: 'Jul', revenue: 118000, expenses: 83000, profit: 35000, cashFlow: 30000 },
    { month: 'Aug', revenue: 125000, expenses: 87000, profit: 38000, cashFlow: 33000 },
    { month: 'Sep', revenue: 132000, expenses: 90000, profit: 42000, cashFlow: 37000 },
    { month: 'Oct', revenue: 128000, expenses: 88000, profit: 40000, cashFlow: 35000 },
    { month: 'Nov', revenue: 135000, expenses: 92000, profit: 43000, cashFlow: 38000 },
    { month: 'Dec', revenue: 142000, expenses: 95000, profit: 47000, cashFlow: 42000 }
  ];

  const forecastData: Forecast[] = [
    { period: 'Q1 2025', revenue: 420000, expenses: 315000, profit: 105000, confidence: 85 },
    { period: 'Q2 2025', revenue: 445000, expenses: 330000, profit: 115000, confidence: 78 },
    { period: 'Q3 2025', revenue: 465000, expenses: 340000, profit: 125000, confidence: 72 },
    { period: 'Q4 2025', revenue: 485000, expenses: 350000, profit: 135000, confidence: 65 }
  ];

  const benchmarkData: BenchmarkData[] = [
    { metric: 'Gross Margin', company: 42.5, industry: 38.2, topQuartile: 45.8, category: 'Profitability' },
    { metric: 'Net Margin', company: 18.7, industry: 12.4, topQuartile: 22.1, category: 'Profitability' },
    { metric: 'Current Ratio', company: 2.4, industry: 2.1, topQuartile: 2.8, category: 'Liquidity' },
    { metric: 'ROA', company: 12.3, industry: 8.7, topQuartile: 15.2, category: 'Efficiency' },
    { metric: 'ROE', company: 18.9, industry: 14.2, topQuartile: 21.5, category: 'Efficiency' },
    { metric: 'Debt/Equity', company: 0.35, industry: 0.52, topQuartile: 0.28, category: 'Leverage' }
  ];

  const accountTypeData = [
    { name: 'Assets', value: 2500000, fill: '#3b82f6' },
    { name: 'Liabilities', value: 850000, fill: '#ef4444' },
    { name: 'Equity', value: 1650000, fill: '#22c55e' },
    { name: 'Revenue', value: 1250000, fill: '#eab308' },
    { name: 'Expenses', value: 950000, fill: '#a855f7' }
  ];

  const expenseBreakdown = [
    { category: 'Salaries', amount: 380000, percentage: 40 },
    { category: 'Operations', amount: 190000, percentage: 20 },
    { category: 'Marketing', amount: 142500, percentage: 15 },
    { category: 'Technology', amount: 95000, percentage: 10 },
    { category: 'Facilities', amount: 71250, percentage: 7.5 },
    { category: 'Other', amount: 71250, percentage: 7.5 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatRatio = (value: number) => {
    return `${value.toFixed(2)}:1`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', change: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className={`h-4 w-4 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    } else if (trend === 'down') {
      return <ArrowDownRight className={`h-4 w-4 ${change < 0 ? 'text-green-600' : 'text-red-600'}`} />;
    } else {
      return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMetricColor = (value: number, target?: number) => {
    if (!target) return 'text-blue-600';
    const ratio = value / target;
    if (ratio >= 0.95) return 'text-green-600';
    if (ratio >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportAnalytics = () => {
    const data = {
      metrics: financialMetrics,
      kpis,
      monthlyData,
      forecastData,
      benchmarkData,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({ title: 'Success', description: 'Analytics data exported successfully' });
  };

  const refreshData = async () => {
    setLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({ title: 'Success', description: 'Data refreshed successfully' });
    setLoading(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
      }, 300000); // Refresh every 5 minutes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Financial Analytics
                </h1>
              </div>
              <p className="text-gray-600 text-lg ml-20">Advanced financial analysis and insights</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm font-medium">Auto Refresh</Label>
              </div>
              <Button variant="outline" onClick={refreshData} disabled={loading} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportAnalytics} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              <Filter className="h-5 w-5" />
              Analysis Filters
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Time Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comparison">Comparison</Label>
              <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous-period">Previous Period</SelectItem>
                  <SelectItem value="previous-year">Previous Year</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="forecast">Forecast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                defaultValue={new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Performance</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Trends</TabsTrigger>
            <TabsTrigger value="forecasting" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Forecasting</TabsTrigger>
            <TabsTrigger value="benchmarks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Benchmarks</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-8">
              {/* Key Metrics Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {financialMetrics.slice(0, 4).map(metric => (
                  <Card key={metric.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                          <p className={`text-2xl font-bold ${getMetricColor(metric.value, metric.target)}`}>
                            {metric.unit === 'currency' ? formatCurrency(metric.value) :
                             metric.unit === 'percentage' ? formatPercentage(metric.value) :
                             metric.unit === 'ratio' ? formatRatio(metric.value) :
                             metric.value.toString()}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            {getTrendIcon(metric.trend, metric.change)}
                            <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {metric.change >= 0 ? '+' : ''}{formatPercentage(metric.changePercent)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {metric.target && (
                            <div className="text-xs text-gray-500 font-medium">
                              Target: {metric.unit === 'currency' ? formatCurrency(metric.target) :
                                      metric.unit === 'percentage' ? formatPercentage(metric.target) :
                                      metric.unit === 'ratio' ? formatRatio(metric.target) :
                                      metric.target.toString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Trend */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      <TrendingUp className="h-5 w-5" />
                      Revenue & Profit Trend
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue" />
                        <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={3} name="Profit" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

                {/* Account Distribution */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      <PieChart className="h-5 w-5" />
                      Financial Position
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={accountTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {accountTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

              </div>

              {/* KPI Dashboard */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    <Target className="h-5 w-5" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {kpis.map(kpi => (
                    <div key={kpi.id} className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-gray-800">{kpi.name}</h3>
                        <Badge variant="outline" className="text-xs font-medium bg-white/80">
                          {kpi.category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            {kpi.unit === 'USD' ? formatCurrency(kpi.value) : 
                             kpi.unit === 'days' ? `${kpi.value} days` : 
                             kpi.value.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(kpi.trend, kpi.change)}
                            <span className={`text-sm ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              kpi.value >= kpi.target ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                              kpi.value >= kpi.target * 0.8 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {kpi.unit === 'USD' ? formatCurrency(kpi.target) : kpi.target.toLocaleString()}</span>
                          <span>{((kpi.value / kpi.target) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {financialMetrics.map(metric => (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {metric.category}
                        </p>
                        <p className="text-sm font-medium mt-1">{metric.name}</p>
                        <p className={`text-xl font-bold mt-1 ${getMetricColor(metric.value, metric.target)}`}>
                          {metric.unit === 'currency' ? formatCurrency(metric.value) :
                           metric.unit === 'percentage' ? formatPercentage(metric.value) :
                           metric.unit === 'ratio' ? formatRatio(metric.value) :
                           metric.value.toString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend, metric.change)}
                          <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(Math.abs(metric.changePercent))}
                          </span>
                        </div>
                        {metric.target && (
                          <div className="text-xs text-muted-foreground mt-1">
                            vs Target: {((metric.value / metric.target) * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profitability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                        <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={3} name="Profit" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Flow Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="cashFlow" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                          name="Cash Flow"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percentage }) => `${category} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {expenseBreakdown.map((expense, index) => (
                      <div key={expense.category} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                          />
                          <span className="font-medium">{expense.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                          <div className="text-sm text-muted-foreground">{expense.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-6">
            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Financial Trends Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} name="Profit" />
                      <Line type="monotone" dataKey="cashFlow" stroke="#8b5cf6" strokeWidth={2} name="Cash Flow" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trend Insights */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Growth</p>
                      <p className="text-2xl font-bold text-green-600">+24.5%</p>
                      <p className="text-xs text-muted-foreground">Year over year</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <p className="text-2xl font-bold text-blue-600">18.7%</p>
                      <p className="text-xs text-muted-foreground">+3.3% improvement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Efficiency Score</p>
                      <p className="text-2xl font-bold text-purple-600">87%</p>
                      <p className="text-xs text-muted-foreground">Above industry avg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seasonal Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { month: 'Q1', performance: 85, target: 90 },
                      { month: 'Q2', performance: 92, target: 90 },
                      { month: 'Q3', performance: 88, target: 90 },
                      { month: 'Q4', performance: 95, target: 90 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="month" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Performance" dataKey="performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Target" dataKey="target" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting">
          <div className="space-y-6">
            {/* Forecast Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Financial Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                      <Bar dataKey="profit" fill="#22c55e" name="Profit" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Details */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastData.map(forecast => (
                      <TableRow key={forecast.period}>
                        <TableCell className="font-medium">{forecast.period}</TableCell>
                        <TableCell className="text-right">{formatCurrency(forecast.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(forecast.expenses)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(forecast.profit)}</TableCell>
                        <TableCell className="text-right">
                          {formatPercentage((forecast.profit / forecast.revenue) * 100)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={forecast.confidence >= 80 ? 'default' : forecast.confidence >= 70 ? 'secondary' : 'destructive'}>
                            {forecast.confidence}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Scenario Analysis */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Best Case</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Revenue Growth</span>
                      <span className="font-semibold">+35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin</span>
                      <span className="font-semibold">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Profit</span>
                      <span className="font-semibold">{formatCurrency(675000)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Most Likely</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Revenue Growth</span>
                      <span className="font-semibold">+18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Profit</span>
                      <span className="font-semibold">{formatCurrency(480000)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Worst Case</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Revenue Growth</span>
                      <span className="font-semibold">+5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin</span>
                      <span className="font-semibold">12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Profit</span>
                      <span className="font-semibold">{formatCurrency(315000)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="benchmarks">
          <div className="space-y-6">
            {/* Benchmark Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Company</TableHead>
                      <TableHead className="text-right">Industry Avg</TableHead>
                      <TableHead className="text-right">Top Quartile</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benchmarkData.map(benchmark => (
                      <TableRow key={benchmark.metric}>
                        <TableCell className="font-medium">{benchmark.metric}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{benchmark.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {benchmark.metric.includes('Ratio') ? 
                            formatRatio(benchmark.company) : 
                            formatPercentage(benchmark.company)}
                        </TableCell>
                        <TableCell className="text-right">
                          {benchmark.metric.includes('Ratio') ? 
                            formatRatio(benchmark.industry) : 
                            formatPercentage(benchmark.industry)}
                        </TableCell>
                        <TableCell className="text-right">
                          {benchmark.metric.includes('Ratio') ? 
                            formatRatio(benchmark.topQuartile) : 
                            formatPercentage(benchmark.topQuartile)}
                        </TableCell>
                        <TableCell className="text-center">
                          {benchmark.company >= benchmark.topQuartile ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : benchmark.company >= benchmark.industry ? (
                            <TrendingUp className="h-5 w-5 text-yellow-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Benchmark Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance vs Industry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={benchmarkData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="metric" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="company" fill="#3b82f6" name="Company" />
                      <Bar dataKey="industry" fill="#94a3b8" name="Industry Avg" />
                      <Bar dataKey="topQuartile" fill="#22c55e" name="Top Quartile" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-800">Strong Revenue Growth</h3>
                        <p className="text-green-700 text-sm">
                          Your revenue has grown 24.5% year-over-year, significantly outpacing industry average of 12%.
                          This trend is expected to continue based on current market conditions.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-800">Cash Flow Optimization Opportunity</h3>
                        <p className="text-yellow-700 text-sm">
                          Your cash conversion cycle is 45 days, which is 15 days longer than industry best practices.
                          Consider implementing faster collection processes to improve cash flow.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-800">Expense Management Excellence</h3>
                        <p className="text-blue-700 text-sm">
                          Your expense-to-revenue ratio has improved by 3.2% this quarter. 
                          Maintaining this trend could increase annual profit by $180,000.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Short-term (1-3 months)</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <span>Implement automated invoice processing to reduce collection time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <span>Negotiate better payment terms with key suppliers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <span>Review and optimize recurring expense contracts</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Long-term (6-12 months)</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <span>Invest in technology to improve operational efficiency</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <span>Expand into high-margin service offerings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <span>Consider strategic partnerships to reduce costs</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-700">High Risk</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer concentration: Top 3 customers represent 45% of revenue
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-semibold text-yellow-700">Medium Risk</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Seasonal revenue fluctuation of 25% between quarters
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-700">Low Risk</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Strong liquidity position with 2.4x current ratio
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;