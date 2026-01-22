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
  Coins, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw,
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
  const [error, setError] = useState<string | null>(null);

  const [topLevelKPIs, setTopLevelKPIs] = useState<any>({
    totalRevenue: { mtd: 0, ytd: 0, growth: 0 },
    totalExpenses: { mtd: 0, ytd: 0, growth: 0 },
    netProfit: { amount: 0, margin: 0 },
    cashFlow: { inflow: 0, outflow: 0, net: 0 },
    ebitda: 0,
    operatingCost: 0,
    grossProfit: { amount: 0, margin: 0 },
    accountsReceivable: 0,
    accountsPayable: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [arAgingData, setArAgingData] = useState<any[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<any[]>([]);
  const [clientProfitability, setClientProfitability] = useState<any[]>([]);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch dashboard analytics
        const dashboardRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`,
          { headers }
        );
        
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          if (dashboardData.success) {
            // Map dashboard data to KPIs (placeholder values for now)
            setTopLevelKPIs(prev => ({
              ...prev,
              // You can map actual data here when available
            }));
          }
        }

        // Fetch budget analytics
        const budgetRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/budget-analytics`,
          { headers }
        );
        
        if (budgetRes.ok) {
          const budgetData = await budgetRes.json();
          if (budgetData.success && budgetData.data) {
            // Map budget data
            const { departmentBudgets, topSpendingDepartments } = budgetData.data;
            
            if (topSpendingDepartments) {
              setBudgetVsActual(topSpendingDepartments.map((dept: any) => ({
                category: dept.department,
                budget: dept.allocated,
                actual: dept.spent,
                variance: dept.utilization - 100
              })));
            }
          }
        }

      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod, selectedCurrency]);

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
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">💰 Finance Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive financial insights and performance metrics</p>
          <div className="flex items-center gap-2 mt-2">
            {loading ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-yellow-600">Loading data...</span>
              </>
            ) : error ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600">{error}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live Updates Active</span>
              </>
            )}
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
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Coins className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.totalRevenue.ytd)}</div>
            <p className="text-xs opacity-90">
              MTD: {formatCurrency(topLevelKPIs.totalRevenue.mtd)} 
              <span className="ml-2">+{formatPercentage(topLevelKPIs.totalRevenue.growth)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.totalExpenses.ytd)}</div>
            <p className="text-xs opacity-90">
              MTD: {formatCurrency(topLevelKPIs.totalExpenses.mtd)}
              <span className="ml-2">{formatPercentage(topLevelKPIs.totalExpenses.growth)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.netProfit.amount)}</div>
            <p className="text-xs opacity-90">Margin: {formatPercentage(topLevelKPIs.netProfit.margin)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.cashFlow.net)}</div>
            <p className="text-xs opacity-90">
              In: {formatCurrency(topLevelKPIs.cashFlow.inflow)} | 
              Out: {formatCurrency(topLevelKPIs.cashFlow.outflow)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <BarChart3 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(topLevelKPIs.ebitda)}</div>
            <p className="text-xs opacity-90">Earnings Before Interest, Tax, D&A</p>
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
                  {revenueData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                  ) : (
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
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientProfitability.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No client data available</div>
                  ) : (
                    clientProfitability.map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{client.client}</div>
                          <div className="text-sm text-muted-foreground">Margin: {formatPercentage(client.margin)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(client.revenue)}</div>
                          <div className="text-sm text-green-600">{formatCurrency(client.profit)} profit</div>
                        </div>
                      </div>
                    ))
                  )}
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
                  
                  {topLevelKPIs.cashFlow?.net > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Cash Reserve Runway</div>
                      <div className="text-2xl font-bold">N/A</div>
                      <div className="text-sm text-gray-600">Based on current burn rate</div>
                    </div>
                  )}
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
                  
                  {arAgingData.length > 0 && arAgingData[3]?.amount > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {formatCurrency(arAgingData[3].amount)} in invoices are overdue by 90+ days. Immediate action required.
                      </AlertDescription>
                    </Alert>
                  )}
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
                  <div className="text-center text-muted-foreground py-8">
                    <p>Predictive analytics will be available once sufficient data is collected.</p>
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
