"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  RefreshCw,
  FileText,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/utils/formatters';

interface IntegratedDashboardProps {
  projectId: string;
}

interface DashboardData {
  projectId: string;
  budget: {
    id: string;
    totalBudget: number;
    actualSpent: number;
    remainingBudget: number;
    utilizationPercentage: number;
    status: string;
    currency: string;
  } | null;
  projectLedger: {
    totalEntries: number;
    totalDebits: number;
    totalCredits: number;
    recentEntries: any[];
  };
  generalLedger: {
    affectedAccounts: number;
    recentEntries: any[];
  };
  categoryBreakdown: Array<{
    type: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
  }>;
  variance: {
    budgetVsActual: number;
    variancePercentage: number;
    status: string;
    alerts: string[];
  } | null;
  realTimeMetrics: {
    budgetHealth: string;
    cashFlow: number;
    lastUpdated: string;
  };
}

export default function IntegratedFinanceDashboard({ projectId }: IntegratedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const socket = useSocket();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time listeners
    if (socket) {
      socket.on('budget:updated', handleBudgetUpdate);
      socket.on('project:ledger:updated', handleLedgerUpdate);
      socket.on('general:ledger:updated', handleGeneralLedgerUpdate);
      socket.on('budget:alert', handleBudgetAlert);
      socket.on('budget:variance:analysis', handleVarianceUpdate);
    }

    return () => {
      if (socket) {
        socket.off('budget:updated');
        socket.off('project:ledger:updated');
        socket.off('general:ledger:updated');
        socket.off('budget:alert');
        socket.off('budget:variance:analysis');
      }
    };
  }, [projectId, socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrated-finance/projects/${projectId}/dashboard`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetUpdate = (data: any) => {
    if (data.projectId === projectId) {
      setDashboardData(prev => prev ? {
        ...prev,
        budget: {
          ...prev.budget!,
          actualSpent: data.budget.actualSpent,
          remainingBudget: data.budget.remainingBudget,
          utilizationPercentage: data.budget.utilizationPercentage
        },
        realTimeMetrics: {
          ...prev.realTimeMetrics,
          lastUpdated: new Date().toISOString()
        }
      } : null);
      setLastSync(new Date());
    }
  };

  const handleLedgerUpdate = (data: any) => {
    if (data.projectId === projectId) {
      fetchDashboardData(); // Refresh full data
      setLastSync(new Date());
    }
  };

  const handleGeneralLedgerUpdate = (data: any) => {
    setLastSync(new Date());
  };

  const handleBudgetAlert = (alert: any) => {
    if (alert.projectId === projectId) {
      setAlerts(prev => [alert, ...prev.slice(0, 4)]);
    }
  };

  const handleVarianceUpdate = (variance: any) => {
    if (variance.projectId === projectId) {
      setDashboardData(prev => prev ? {
        ...prev,
        variance
      } : null);
    }
  };

  const syncBudgets = async () => {
    try {
      const response = await fetch('/api/integrated-finance/budgets/sync', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        fetchDashboardData();
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Error syncing budgets:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No financial data available for this project.
        </AlertDescription>
      </Alert>
    );
  }

  const { budget, projectLedger, generalLedger, categoryBreakdown, variance, realTimeMetrics } = dashboardData;

  const getBudgetHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'over-budget': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getVarianceColor = (percentage: number) => {
    if (percentage > 10) return 'text-green-600';
    if (percentage < -10) return 'text-red-600';
    return 'text-yellow-600';
  };

  const categoryColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integrated Finance Dashboard</h2>
          <p className="text-sm text-gray-600">
            Last updated: {new Date(realTimeMetrics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={syncBudgets} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Badge variant={realTimeMetrics.budgetHealth === 'healthy' ? 'default' : 'destructive'}>
            {realTimeMetrics.budgetHealth.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.projectName}:</strong> {alert.alerts.join(', ')}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget ? formatCurrency(budget.totalBudget) : 'No Budget'}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget?.currency || 'INR'} • {budget?.status || 'No Status'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget ? formatCurrency(budget.actualSpent) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget ? `${budget.utilizationPercentage.toFixed(1)}% utilized` : '0% utilized'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budget ? formatCurrency(budget.remainingBudget) : formatCurrency(0)}
            </div>
            <p className={`text-xs ${getBudgetHealthColor(realTimeMetrics.budgetHealth)}`}>
              {realTimeMetrics.budgetHealth.replace('-', ' ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(realTimeMetrics.cashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net project flow
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization Progress */}
      {budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilized: {formatCurrency(budget.actualSpent)}</span>
                <span>Remaining: {formatCurrency(budget.remainingBudget)}</span>
              </div>
              <Progress 
                value={Math.min(budget.utilizationPercentage, 100)} 
                className={budget.utilizationPercentage > 100 ? 'bg-red-100' : ''}
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>0%</span>
                <span>{budget.utilizationPercentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="variance">Variance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Ledger Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-semibold">{projectLedger.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Debits:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(projectLedger.totalDebits)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Credits:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(projectLedger.totalCredits)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Net Position:</span>
                    <span className={`font-semibold ${
                      projectLedger.totalDebits - projectLedger.totalCredits >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(projectLedger.totalDebits - projectLedger.totalCredits)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>General Ledger Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Affected Accounts:</span>
                    <span className="font-semibold">{generalLedger.affectedAccounts}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    This project has impacted {generalLedger.affectedAccounts} accounts in the general ledger.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, utilizationPercentage }) => `${type}: ${utilizationPercentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="spent"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.map((category, index) => (
                    <div key={category.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.type}</span>
                        <Badge variant={category.utilizationPercentage > 100 ? "destructive" : "default"}>
                          {category.utilizationPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={Math.min(category.utilizationPercentage, 100)} />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Spent: {formatCurrency(category.spent)}</span>
                        <span>Allocated: {formatCurrency(category.allocated)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Project Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectLedger.recentEntries.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">{entry.entryNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(entry.totalDebit)}</p>
                        <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent GL Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generalLedger.recentEntries.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">{entry.accountId?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : formatCurrency(entry.credit)}
                        </p>
                        <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          {variance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Variance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Budget vs Actual:</span>
                      <span className={`font-semibold ${getVarianceColor(variance.variancePercentage)}`}>
                        {formatCurrency(variance.budgetVsActual)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Variance Percentage:</span>
                      <span className={`font-semibold ${getVarianceColor(variance.variancePercentage)}`}>
                        {variance.variancePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <Badge variant={variance.status === 'over-budget' ? 'destructive' : 'default'}>
                        {variance.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {variance.alerts.length > 0 ? (
                      variance.alerts.map((alert, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{alert}</AlertDescription>
                        </Alert>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No active alerts</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}