"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw,
  FileText, BarChart3, PieChart, Target, CreditCard, Wallet, Building,
  Calendar, Users, Package, ShoppingCart, Clock, Bell, Download, Eye,
  Calculator, Receipt, Banknote, ArrowUpRight, ArrowDownRight, Percent
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, ReferenceLine
} from 'recharts';


const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  emerald: '#10b981'
};

interface FinanceAnalyticsDashboardProps {
  dateRange?: string;
  currency?: string;
}

export default function FinanceAnalyticsDashboard({ 
  dateRange = '30d', 
  currency = 'INR' 
}: FinanceAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const topLevelKPIs = {
    totalRevenue: { mtd: 2450000, ytd: 18750000, growth: 12.5 },
    totalExpenses: { mtd: 1890000, ytd: 14200000, growth: -3.2 },
    netProfit: { amount: 4550000, margin: 24.3 },
    cashFlow: { inflow: 2100000, outflow: 1650000, net: 450000 },
    ebitda: 5200000,
    operatingCost: 12800000,
    grossProfit: { amount: 6950000, margin: 37.1 },
    accountsReceivable: 3200000,
    accountsPayable: 1850000
  };

  const revenueData = [
    { month: 'Jan', revenue: 1200000, target: 1100000, growth: 8.2 },
    { month: 'Feb', revenue: 1350000, target: 1200000, growth: 12.5 },
    { month: 'Mar', revenue: 1180000, target: 1150000, growth: 2.6 },
    { month: 'Apr', revenue: 1420000, target: 1300000, growth: 9.2 },
    { month: 'May', revenue: 1650000, target: 1400000, growth: 17.9 },
    { month: 'Jun', revenue: 1580000, target: 1450000, growth: 9.0 }
  ];

  const expenseBreakdown = [
    { category: 'Staff Salaries', amount: 8500000, budget: 9000000, variance: -5.6 },
    { category: 'Office Rent', amount: 1200000, budget: 1200000, variance: 0 },
    { category: 'Software Licenses', amount: 850000, budget: 800000, variance: 6.3 },
    { category: 'Marketing', amount: 1500000, budget: 1400000, variance: 7.1 },
    { category: 'Operations', amount: 950000, budget: 1000000, variance: -5.0 },
    { category: 'Travel', amount: 320000, budget: 400000, variance: -20.0 }
  ];

  const profitabilityData = [
    { month: 'Jan', netProfit: 280000, margin: 23.3 },
    { month: 'Feb', netProfit: 320000, margin: 23.7 },
    { month: 'Mar', netProfit: 265000, margin: 22.5 },
    { month: 'Apr', netProfit: 385000, margin: 27.1 },
    { month: 'May', netProfit: 445000, margin: 27.0 },
    { month: 'Jun', netProfit: 420000, margin: 26.6 }
  ];

  const cashFlowData = [
    { day: 'Mon', cashIn: 85000, cashOut: 62000, balance: 23000 },
    { day: 'Tue', cashIn: 92000, cashOut: 58000, balance: 34000 },
    { day: 'Wed', cashIn: 78000, cashOut: 71000, balance: 7000 },
    { day: 'Thu', cashIn: 105000, cashOut: 83000, balance: 22000 },
    { day: 'Fri', cashIn: 88000, cashOut: 65000, balance: 23000 }
  ];

  const arAgingData = [
    { range: '0-30 days', amount: 1200000, percentage: 37.5, color: COLORS.success },
    { range: '31-60 days', amount: 950000, percentage: 29.7, color: COLORS.warning },
    { range: '61-90 days', amount: 680000, percentage: 21.3, color: COLORS.orange },
    { range: '90+ days', amount: 370000, percentage: 11.6, color: COLORS.danger }
  ];

  const budgetVsActual = [
    { category: 'Revenue', budget: 18000000, actual: 18750000, variance: 4.2 },
    { category: 'Expenses', budget: 14800000, actual: 14200000, variance: -4.1 },
    { category: 'Marketing', budget: 1400000, actual: 1500000, variance: 7.1 },
    { category: 'Operations', budget: 1000000, actual: 950000, variance: -5.0 }
  ];

  const clientProfitability = [
    { client: 'TechCorp Ltd', revenue: 2500000, profit: 650000, margin: 26.0 },
    { client: 'Global Systems', revenue: 1800000, profit: 485000, margin: 26.9 },
    { client: 'Innovation Hub', revenue: 1200000, profit: 280000, margin: 23.3 },
    { client: 'Digital Solutions', revenue: 950000, profit: 190000, margin: 20.0 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-green-600';
    if (variance < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Finance Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and performance metrics</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Live Updates Active</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="fy">Financial Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Top-Level Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.totalRevenue.ytd)}</div>
            <p className="text-xs opacity-80">
              MTD: {formatCurrency(topLevelKPIs.totalRevenue.mtd)} 
              <span className="ml-2 text-green-200">+{formatPercentage(topLevelKPIs.totalRevenue.growth)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.totalExpenses.ytd)}</div>
            <p className="text-xs opacity-80">
              MTD: {formatCurrency(topLevelKPIs.totalExpenses.mtd)}
              <span className="ml-2 text-green-200">{formatPercentage(topLevelKPIs.totalExpenses.growth)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.netProfit.amount)}</div>
            <p className="text-xs opacity-80">Margin: {formatPercentage(topLevelKPIs.netProfit.margin)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.cashFlow.net)}</div>
            <p className="text-xs opacity-80">
              In: {formatCurrency(topLevelKPIs.cashFlow.inflow)} | 
              Out: {formatCurrency(topLevelKPIs.cashFlow.outflow)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <BarChart3 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.ebitda)}</div>
            <p className="text-xs opacity-80">Earnings Before Interest, Tax, D&A</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Cost</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.operatingCost)}</div>
            <p className="text-xs text-muted-foreground">Total operational expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.grossProfit.amount)}</div>
            <p className="text-xs text-muted-foreground">
              Margin: {formatPercentage(topLevelKPIs.grossProfit.margin)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.accountsReceivable)}</div>
            <p className="text-xs text-muted-foreground">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.accountsPayable)}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="receivables">A/R</TabsTrigger>
          <TabsTrigger value="payables">A/P</TabsTrigger>
          <TabsTrigger value="budgeting">Budget</TabsTrigger>
          <TabsTrigger value="investments">Assets</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="revenue" fill={COLORS.primary} name="Actual Revenue" />
                      <Line type="monotone" dataKey="target" stroke={COLORS.danger} name="Target" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientProfitability.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{client.client}</div>
                        <div className="text-sm text-gray-600">Margin: {formatPercentage(client.margin)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(client.revenue)}</div>
                        <div className="text-sm text-green-600">{formatCurrency(client.profit)} profit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, amount }) => `${category}: ${formatCurrency(amount)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense vs Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((expense, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{expense.category}</span>
                        <Badge variant={expense.variance > 0 ? "destructive" : "default"}>
                          {expense.variance > 0 ? '+' : ''}{formatPercentage(expense.variance)}
                        </Badge>
                      </div>
                      <Progress value={(expense.amount / expense.budget) * 100} />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Spent: {formatCurrency(expense.amount)}</span>
                        <span>Budget: {formatCurrency(expense.budget)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Net Profit Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profitabilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="netProfit" fill={COLORS.success} name="Net Profit" />
                      <Line yAxisId="right" type="monotone" dataKey="margin" stroke={COLORS.primary} name="Profit Margin %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Profitability Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientProfitability.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{client.client}</div>
                        <div className="text-sm text-gray-600">Revenue: {formatCurrency(client.revenue)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{formatCurrency(client.profit)}</div>
                        <div className="text-sm text-gray-600">{formatPercentage(client.margin)} margin</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Cash Flow Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="cashIn" fill={COLORS.success} name="Cash In" />
                      <Bar dataKey="cashOut" fill={COLORS.danger} name="Cash Out" />
                      <Line type="monotone" dataKey="balance" stroke={COLORS.primary} name="Net Balance" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Total Cash In</span>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(topLevelKPIs.cashFlow.inflow)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Total Cash Out</span>
                    </div>
                    <span className="font-bold text-red-600">{formatCurrency(topLevelKPIs.cashFlow.outflow)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Net Cash Flow</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(topLevelKPIs.cashFlow.net)}</span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Cash Reserve Runway</div>
                    <div className="text-2xl font-bold">4.2 months</div>
                    <div className="text-sm text-gray-600">Based on current burn rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={arAgingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, percentage }) => `${range}: ${formatPercentage(percentage)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {arAgingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding Invoices Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Pending Amount</span>
                    <span className="font-bold text-2xl">{formatCurrency(topLevelKPIs.accountsReceivable)}</span>
                  </div>
                  
                  {arAgingData.map((aging, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{aging.range}</span>
                        <span className="font-semibold">{formatCurrency(aging.amount)}</span>
                      </div>
                      <Progress value={aging.percentage} className="h-2" />
                      <div className="text-xs text-gray-600">{formatPercentage(aging.percentage)} of total</div>
                    </div>
                  ))}
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {formatCurrency(370000)} in invoices are overdue by 90+ days. Immediate action required.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgeting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetVsActual}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="budget" fill={COLORS.info} name="Budget" />
                      <Bar dataKey="actual" fill={COLORS.primary} name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Variance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetVsActual.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-gray-600">
                          Budget: {formatCurrency(item.budget)} | Actual: {formatCurrency(item.actual)}
                        </div>
                      </div>
                      <Badge variant={item.variance > 0 ? "destructive" : "default"}>
                        {item.variance > 0 ? '+' : ''}{formatPercentage(item.variance)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment & Asset Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Investment and asset analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Compliance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tax and compliance analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Smart Finance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> Cash flow projected to go negative in 15 days
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Marketing budget exceeded by 7.1%
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Reminder:</strong> 12 invoices due for payment this week
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Info:</strong> Q3 financial reports ready for review
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">Revenue Forecast (Next 3 Months)</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(4850000)}</div>
                    <div className="text-sm text-blue-700">Based on current trends and pipeline</div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">Expense Optimization Potential</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(285000)}</div>
                    <div className="text-sm text-green-700">Identified savings opportunities</div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-900">Collection Risk Assessment</div>
                    <div className="text-2xl font-bold text-yellow-600">Medium Risk</div>
                    <div className="text-sm text-yellow-700">{formatCurrency(680000)} at risk of delayed payment</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}