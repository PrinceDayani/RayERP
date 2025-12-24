'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, AlertTriangle, Download, RefreshCw, Building2, Briefcase, Banknote, PieChart, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

export default function BudgetConsolidationPage() {
  const router = useRouter();
  const [consolidation, setConsolidation] = useState<any>(null);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsolidation();
  }, [fiscalYear, currency]);

  const fetchConsolidation = async () => {
    setLoading(true);
    try {
      console.log('Fetching consolidation with:', { fiscalYear, currency });
      const response = await api.get('/budgets/consolidation', {
        params: { fiscalYear, currency }
      });
      console.log('Consolidation response:', response);
      setConsolidation(response.data.data);
    } catch (error: any) {
      console.error('Error fetching consolidation:', error);
      console.error('Error details:', { message: error.message, status: error.status, data: error.data });
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch consolidation data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!consolidation) return;
    const data = JSON.stringify(consolidation, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-consolidation-${fiscalYear}-${currency}.json`;
    a.click();
    toast({ title: 'Success', description: 'Data exported successfully' });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading consolidation data...</p>
      </div>
    </div>
  );
  
  if (!consolidation) return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-muted-foreground">No consolidation data available</p>
          <Button onClick={fetchConsolidation} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Master Budget Consolidation</h1>
            <p className="text-muted-foreground">Consolidated view of all budgets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2022, 2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR ₹</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchConsolidation}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{consolidation.summary.totalBudgets}</p>
            <p className="text-xs text-muted-foreground mt-1">Active budgets</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currency} {consolidation.summary.totalAllocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-1">Total budget pool</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currency} {consolidation.summary.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-1">{currency} {consolidation.summary.totalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })} remaining</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{consolidation.summary.avgUtilization.toFixed(1)}%</p>
            <Progress value={consolidation.summary.avgUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              By Budget Type
            </CardTitle>
            <CardDescription>Distribution across budget categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(consolidation.byType).map(([type, data]: [string, any]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{type}</Badge>
                    <span className="text-sm text-muted-foreground">{data.count} budgets</span>
                  </div>
                  <span className="font-semibold text-sm">{data.utilization.toFixed(1)}%</span>
                </div>
                <Progress value={data.utilization} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currency} {data.allocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <span>{currency} {data.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              By Category
            </CardTitle>
            <CardDescription>Spending breakdown by category type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(consolidation.byCategory).map(([cat, data]: [string, any]) => {
              const utilization = data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="capitalize font-medium">{cat}</span>
                    <span className="text-muted-foreground">{utilization.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currency} {data.allocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span>{data.count} items</span>
                  </div>
                  <Progress value={utilization} className="h-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className={consolidation.alerts.length > 0 ? 'border-orange-200' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Budget Alerts
            </CardTitle>
            <CardDescription>
              {consolidation.alerts.length} active alert{consolidation.alerts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {consolidation.alerts.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">All budgets are healthy</p>
              </div>
            ) : (
              consolidation.alerts.slice(0, 5).map((alert: any, idx: number) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{alert.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'default'} className="flex-shrink-0">
                    {alert.type}
                  </Badge>
                </div>
              ))
            )}
            {consolidation.alerts.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">+{consolidation.alerts.length - 5} more alerts</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Top Projects
            </CardTitle>
            <CardDescription>Highest budget allocations by project</CardDescription>
          </CardHeader>
          <CardContent>
            {consolidation.topProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No project budgets</p>
            ) : (
              <div className="space-y-3">
                {consolidation.topProjects.map((project: any, idx: number) => (
                  <div key={project.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={project.utilization} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">{project.utilization.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currency} {project.allocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-muted-foreground">{currency} {project.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Departments
            </CardTitle>
            <CardDescription>Highest budget allocations by department</CardDescription>
          </CardHeader>
          <CardContent>
            {consolidation.topDepartments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No department budgets</p>
            ) : (
              <div className="space-y-3">
                {consolidation.topDepartments.map((dept: any, idx: number) => (
                  <div key={dept.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{dept.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={dept.utilization} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">{dept.utilization.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currency} {dept.allocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-muted-foreground">{currency} {dept.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
